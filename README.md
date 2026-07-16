# Rookie Vault Scan Assistant v1

No Supabase migration is required.

Replace:
- `index.html`
- `css/app.css`
- `js/app.js`
- `sw.js`

Keep `js/config.js`.

## Adds
- Scan tab with front/back camera capture
- Free in-browser OCR using Tesseract.js
- Progress bar and raw OCR text
- Suggested player, year, brand, set, card number, sport, parallel and rookie status
- Confidence label
- Possible duplicate detection and quantity increase
- Sold-listing search
- One-tap transfer of details and photos into Add Card
- PWA cache version `rookie-vault-v13`

OCR is an assistant, not guaranteed identification. Foil, glare, tiny text and unusual fonts can reduce accuracy. The first scan takes longer because OCR language data must download.

Suggested commit: `Add free OCR scan assistant and duplicate detection`
