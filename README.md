# Rookie Vault Photo Verification Fix

No database migration is required.

Replace:
- `index.html`
- `css/app.css`
- `css/cardsight-diagnostics.css`
- `js/app.js`
- `js/cardsight-diagnostics.js`
- `sw.js`

Keep:
- `js/config.js`

## What changed

- Verifies that each selected photo compresses to a non-empty JPEG
- Uploads each photo to the `card-photos` Supabase Storage bucket
- Downloads the newly uploaded object to prove it exists and is readable
- Creates a signed URL and opens it before the card is saved
- Retries photo verification three times for slower mobile connections
- Supports both `signedUrl` and `signedURL` response property names
- Verifies the photo paths were actually returned with the saved database row
- Reports whether zero, one, or two photos are readable after collection reload
- Gives a specific Storage policy error instead of reporting a false successful save
- PWA cache version v22

## Existing test card

Edit the existing test card, select its front and back photos again, and save.
The new code will either verify both photos or show the exact failing Storage step.

Suggested commit:

`Verify Supabase photo uploads before saving cards`
