# Rookie Vault - Small Wins Update (v28)

One small addition: an Xbox gamertag quick-link in the Spotlight panel.
No Supabase migration needed.

**Everything in this bundle is a ready-to-extract, drop-in replacement.**

## Files in this bundle (replace all of these)

- `index.html` — Xbox gamertag field + profile link added to Spotlight;
  version tags bumped to v28
- `js/spotlight.js` — stores the gamertag on-device, builds the link
- `css/worlds.css` — small style for the new inline row
- Everything else — unchanged this round, included for completeness

Keep as-is (not in this bundle): `js/config.js`

## Xbox: quick link, not a live panel

You picked the zero-setup option, so here's what this actually is: Brenton
types his gamertag once (saved on-device, same pattern as everything
else), and it builds a link to his public profile on xboxgamertag.com — a
real, established Xbox profile lookup site, not something I made up. It
shows gamerscore, recent games, and achievements if his profile is public.

**What this isn't:** a live gamerscore/recently-played widget inside the
app. That's genuinely possible — there's a real, currently-active
third-party service (OpenXBL / xbl.io) that a lot of hobby Xbox apps use,
personal API key, same effort tier as the CardSight key you two already
set up. I looked into it and it's legitimate, just tabled for now since
you picked the simple version. Say the word whenever you want to revisit
it — filtered to just his sports titles (Madden, NBA 2K, MLB The Show,
etc.) it'd fit right in next to the sports ticker and card news.

One honest note on the link itself: Microsoft's own official public
profile URL format has changed more than once over the years and I
couldn't verify a current one I'd trust to just work, so I used the
third-party lookup site instead — confirmed the URL pattern actually
resolves before shipping it, same as every other link/ID in this project.

## Before you commit

1. Type a gamertag into the new field on Home's Spotlight panel and
   confirm the link updates to that gamertag's profile.
2. Leave it blank and confirm the link still works (falls back to the
   general lookup page rather than a broken link).
3. Everything else — unchanged this round, no need to re-test unless
   you want to.

## Suggested commit

`Add Xbox gamertag quick-link to Spotlight panel`
