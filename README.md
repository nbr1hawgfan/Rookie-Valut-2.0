# Rookie Vault Trade Builder Upgrade

No Supabase migration is required.

Replace:

- `index.html`
- `css/app.css`
- `js/app.js`
- `sw.js`

Keep:

- `js/config.js`

## Adds

- Trade tab in bottom navigation
- Select cards from Brenton's active collection
- Add incoming cards manually
- Quantity-aware values
- Side-by-side totals
- Difference calculation
- Fairness rating
- Clear-trade action
- Mobile-friendly trade layout
- PWA cache version `rookie-vault-v11`

## Rating guide

- Within 5%: Very fair
- Within 12%: Close trade
- Within 25%: Uneven
- More than 25%: Very uneven

This is guidance only. Condition, demand, grading, rarity, and recent comparable sales still matter.

Suggested commit:

`Add trade builder and fairness rating`
