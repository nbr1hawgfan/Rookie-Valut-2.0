# Rookie Vault CardSight Diagnostics

No Supabase migration is required.

Replace:
- `index.html`
- `css/app.css`
- `css/cardsight-diagnostics.css`
- `js/app.js`
- `js/cardsight-diagnostics.js`
- `sw.js`

Keep `js/config.js`.

## Tests
- SDK/client creation
- Public API health
- API-key authentication
- Account/subscription usage
- Aaron Judge autocomplete
- Aaron Judge catalog search
- Optional current-photo card detection

The report exposes the real response/error while redacting keys and authorization values.

Suggested commit: `Add CardSight connection and catalog diagnostics`
