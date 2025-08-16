# Náborový web řemeslníci

Statická landing page s kontaktním formulářem s nahráním CV a odesláním na e‑mail přes Netlify Function (Nodemailer).

## Nasazení na Netlify

1. Propojte tento GitHub repozitář s Netlify (New site from Git → GitHub → vyberte repo)
2. Build / deploy nastavení
   - Build command: none (statická stránka)
   - Publish directory: `./` (kořen repozitáře)
3. Environment variables (Site settings → Environment variables):
   - `SMTP_HOST` – např. `smtp.gmail.com`
   - `SMTP_PORT` – `465` (SSL) nebo `587` (TLS)
   - `SMTP_USER` – přihlašovací e‑mail / uživatel
   - `SMTP_PASS` – heslo k SMTP nebo App Password (u Gmailu vyžadováno)
   - `FROM_EMAIL` – volitelné (výchozí je `SMTP_USER`)
   - `TO_EMAIL` – volitelné (výchozí je hodnota z formuláře `to_email`)
4. Deployujte. Netlify automaticky vytvoří endpoint `/ .netlify/functions/submit-form`.

## Lokální vývoj

Netlify Functions používají závislosti:

```bash
npm install
```

Soubory:
- `naborovy-web.html` – hlavní stránka
- `index.html` – přesměrování na hlavní stránku (kvůli defaultnímu názvu)
- `netlify/functions/submit-form.js` – serverless funkce (Nodemailer)
- `netlify.toml` – konfigurace functions a CORS

## Poznámky k Gmailu
- Zapněte 2FA, vytvořte **App Password** a použijte ho jako `SMTP_PASS`
- Pokud používáte port 587, doporučuje se STARTTLS (což Nodemailer nastaví automaticky pro `secure: false`)

## Ochrana proti SPAMu (volitelné)
- Lze přidat jednoduchý honeypot input
- Nebo reCAPTCHA v3 (integrovat na frontendu a validovat token v serverless funkci)

## Úprava e‑mailu
- Předmět, text a HTML si upravte v `netlify/functions/submit-form.js`

