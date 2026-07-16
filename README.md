# Rookie Vault Pricing Research Upgrade

## First: run the migration

Run this file in Supabase SQL Editor:

- `supabase/pricing-research-migration.sql`

## Then replace

- `index.html`
- `css/app.css`
- `js/app.js`
- `sw.js`

Keep:

- `js/config.js`

## Adds

- Exact pricing search generated from card details
- eBay sold-listing search
- eBay active-listing search
- SportsCardsPro search
- General web pricing search
- Copy-search button
- Update estimated value from the detail screen
- Save price source
- Save comparable-sale notes
- Save latest research date
- Pricing fields included in CSV and JSON backups
- PWA cache version `rookie-vault-v12`

## Suggested test

1. Open a card with good identifying details.
2. Confirm the generated search includes player, year, set and card number.
3. Open eBay sold and SportsCardsPro.
4. Enter a revised estimated value, source and note.
5. Save and confirm the dashboard and trade builder use the updated value.

Suggested commit:

`Add pricing research links and value history metadata`
