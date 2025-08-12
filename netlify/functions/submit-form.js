// Netlify Function: submit-form
// Parses multipart/form-data (incl. file upload) and sends email via SMTP using Nodemailer
// Configure environment variables in Netlify (Site settings → Environment variables):
// - SMTP_HOST: e.g. smtp.gmail.com
// - SMTP_PORT: e.g. 465 or 587
// - SMTP_USER: SMTP username (for Gmail use full address)
// - SMTP_PASS: SMTP password or App Password (Gmail requires App Password)
// - FROM_EMAIL: optional, overrides sender address (default SMTP_USER)
// - TO_EMAIL: optional default recipient (fallback used if not provided in form)

const Busboy = require('busboy');
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return { statusCode: 400, body: 'Bad Request: Expected multipart/form-data' };
    }

    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '');

    const fields = {};
    const files = [];

    await new Promise((resolve, reject) => {
      const bb = new Busboy({ headers: { 'content-type': contentType } });

      bb.on('field', (name, val) => {
        fields[name] = val;
      });

      bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const chunks = [];
        file.on('data', (d) => chunks.push(d));
        file.on('limit', () => {});
        file.on('end', () => {
          const content = Buffer.concat(chunks);
          if (filename && content.length > 0) {
            files.push({ filename, content, contentType: mimetype });
          }
        });
      });

      bb.on('error', (err) => reject(err));
      bb.on('finish', () => resolve());

      bb.end(bodyBuffer);
    });

    const toEmail = fields.to_email || process.env.TO_EMAIL || 'dmd.obchod@gmail.com';

    // Build transporter
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // true for 465, false for others
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

    const textLines = [
      `Jméno: ${fields.name || ''}`,
      `Telefon: ${fields.phone || ''}`,
      `Profese: ${fields.profession || ''}`,
      `Zpráva: ${fields.message || ''}`,
      files.length ? `Přílohy: ${files.map((f) => f.filename).join(', ')}` : 'Přílohy: žádné',
    ];

    const html = `
      <h2>Nová poptávka z webu</h2>
      <p><strong>Jméno:</strong> ${escapeHTML(fields.name || '')}</p>
      <p><strong>Telefon:</strong> ${escapeHTML(fields.phone || '')}</p>
      <p><strong>Profese:</strong> ${escapeHTML(fields.profession || '')}</p>
      <p><strong>Zpráva:</strong><br/>${escapeHTML((fields.message || '').replace(/\n/g, '<br/>'))}</p>
      <p><strong>Přílohy:</strong> ${files.length ? files.map((f) => escapeHTML(f.filename)).join(', ') : 'žádné'}</p>
    `;

    await transporter.sendMail({
      from: `Web Poptávka <${fromEmail}>`,
      to: toEmail,
      subject: 'Nová poptávka z webu',
      text: textLines.join('\n'),
      html,
      attachments: files.map((f) => ({ filename: f.filename, content: f.content, contentType: f.contentType })),
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: 'Děkujeme! Poptávka byla odeslána.' }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: 'Server error: ' + (err && err.message ? err.message : 'unknown') };
  }
};

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

