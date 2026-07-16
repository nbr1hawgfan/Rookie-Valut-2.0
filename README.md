# Rookie Vault Trash + Restore Upgrade

Replace these files:

- `index.html`
- `css/app.css`
- `js/app.js`
- `sw.js`

Do not replace or delete:

- `js/config.js`

## Adds

- Collection / Trash toggle
- Deleted-card count
- Restore deleted cards
- Permanently delete cards
- Permanently deleting a card also removes its stored photos
- Dashboard totals exclude trashed cards
- Search works inside Trash
- PWA cache version `rookie-vault-v7`

## Test

1. Open a card.
2. Tap **Move to trash**.
3. Open **Trash**.
4. Open the card and tap **Restore card**.
5. Move it to trash again and test permanent delete only with a disposable test card.

Suggested commit:

`Add trash restore and permanent delete`
