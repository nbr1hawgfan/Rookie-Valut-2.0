# Rookie Vault Backup + Export Upgrade

No Supabase migration is required.

Replace:

- `index.html`
- `css/app.css`
- `js/app.js`
- `sw.js`

Keep:

- `js/config.js`

## Adds

- CSV export of active cards
- Complete JSON backup of active and trashed cards
- Photo storage paths included in JSON
- Readable collection summary text file
- Last backup date stored on each device
- Quantity-aware collection and sport values
- PWA cache version `rookie-vault-v10`

## Suggested test

1. Download CSV and open it in Excel or Google Sheets.
2. Download JSON and keep it as the full safety backup.
3. Download the summary and review the totals.
4. Confirm the Last Backup date updates.

Suggested commit:

`Add collection backup and export center`
