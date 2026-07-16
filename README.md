# Rookie Vault CardSight Integration v1

No Supabase migration is required.

Replace:
- `index.html`
- `css/app.css`
- `js/app.js`
- `sw.js`

Keep `js/config.js`.

## Setup
1. Open Scan.
2. Expand CardSight API settings.
3. Paste the CardSight API key.
4. Save it.

The key stays in localStorage on that browser/device. It is not committed to GitHub or stored in Supabase.

## Adds
- CardSight photo identification
- Baseball, football, basketball, and hockey fallback
- Structured CardSight catalog search
- Full catalog-card lookup
- Populates player, year, manufacturer, set, number, parallel, sport, rookie suggestion
- Recent completed-sales estimate
- Suggested value transfers into Add Card
- OCR remains the free local first pass
- Duplicate detection runs after CardSight matches
- PWA cache v17

Suggested commit: `Merge CardSight identification catalog and pricing`
