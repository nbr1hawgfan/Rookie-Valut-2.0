# Rookie Vault Edit + Add Photos Upgrade

Replace these files:

- `index.html`
- `css/app.css`
- `js/app.js`
- `sw.js`

Do not replace or delete:

- `js/config.js`

## What this adds

- Edit button inside the card detail view
- Existing card details load into the form
- Add photos to cards that previously had none
- Replace only the front photo, only the back photo, or both
- Existing photos remain when no replacement is selected
- Old photo files are removed after a successful replacement
- Cancel editing without changing the card
- PWA cache version `rookie-vault-v6`

## Test the original card

1. Tap the first test card.
2. Tap **Edit card**.
3. Choose a front and/or back image.
4. Tap **Update card**.
5. Open the card again and switch between Front and Back.

Suggested commit:

`Add card editing and photo replacement`
