# Rookie Vault Set Tracker v1

## First: run the migration

Run:

- `supabase/set-tracker-migration.sql`

in Supabase SQL Editor.

## Then replace

- `index.html`
- `css/app.css`
- `js/app.js`
- `sw.js`

Keep:

- `js/config.js`

## Adds

- Set Tracker button on Home
- Create, edit and delete set goals
- Match owned cards automatically by year, brand, set and numeric card number
- Completion percentage and progress bars
- Owned and missing card-number grids
- Select a missing number and prefill Add Card
- Home dashboard set-progress summaries
- Set-complete celebration state
- PWA cache version `rookie-vault-v15`

## Important limitation

Version 1 is designed for numbered base sets such as cards 1 through 220. It extracts the first numeric part of a card number. Insert sets and alphanumeric checklists will need a more advanced checklist mode later.

Suggested commit:

`Add automatic set tracker and missing card goals`
