# Rookie Vault - Small Wins Update (v26)

This round: card of the day + milestones, hobby videos, and a couple of
quick eBay/PSA links. Plus everything from v25 (music panel, card hobby
news, player watchlist, in-app box scores) and v24 (Vault Ledger, true
black + red theme, scrolling ticker, CardSight filters, card flip). No
Supabase migration needed.

**Everything in this bundle is a ready-to-extract, drop-in replacement.**
`index.html` already has every panel, stylesheet, and script tag wired in —
you don't need to hand-edit anything. Just replace your existing files.

## Files in this bundle (replace all of these)

- `index.html` — spotlight panel, video panel, PSA cert link, eBay shop
  links all added; version tags bumped to v26
- `js/app.js` — new eBay "shop this card" icon on ledger rows, PSA cert
  link logic, broadcasts card summaries + snapshot history for the new
  spotlight panel; everything from v25/v24 (Ledger, CardSight, flip, etc.)
- `js/spotlight.js` — **new** — card of the day + milestone nudges
- `js/video-feed.js` — **new** — hobby video panel (YouTube embeds)
- `js/sports-feed.js` — unchanged this round (player watchlist + box
  scores from v25)
- `js/music-feed.js` — unchanged this round
- `js/hobby-news.js` — unchanged this round
- `js/cardsight-diagnostics.js` — unchanged, included for completeness
- `css/app.css` — true black + red dark theme (unchanged this round)
- `css/sports-feed.css` — ticker, Vault Ledger, flip/shimmer (unchanged)
- `css/worlds.css` — extended with spotlight, milestone banner, and video
  panel styles
- `css/cardsight-diagnostics.css` — unchanged, included for completeness
- `sw.js` — bumped to v26, adds the two new files to the app shell

Keep as-is (not in this bundle): `js/config.js`

## 1. Card of the day + milestones

New panel right under the welcome card on Home:

- **Card of the day** — a deterministic pick from the real collection
  (same card all day, changes the next day) — not random on every visit,
  and not fabricated in any way, just today's date used to pick an index
  into the actual collection. Tapping it opens that card.
- **Milestones** — real thresholds crossed in real data: card count
  (10, 25, 50, 100...) and total value ($500, $1,000, $2,500...). Each one
  shows once, then gets marked as seen on-device so it doesn't repeat.
  When there's no fresh milestone, it falls back to "N cards added this
  week" if that's true, using the same daily snapshot history the Ledger
  already keeps.
- **Two quick links** underneath: a general "Shop sports cards on eBay"
  search, and "Verify a PSA cert" (PSA's own public lookup page — see
  note below on why this is a link, not an automatic per-card lookup).

## 2. Hobby video panel — same no-login pattern as music

Default is **Sports Card Investor** (channel ID
`UCk9zL0UlZ28uS7tlcguSLQg`), one of the hobby's most established YouTube
channels — I confirmed it's real and currently active before shipping it,
same as I did with the Spotify playlist IDs. Uses the standard trick where
a channel's "uploads" playlist ID is just its channel ID with `UC` swapped
for `UU` — no separate playlist lookup needed.

Add more via "Edit channels" — paste a playlist link, a channel link, or a
single video link, all three are handled.

## 3. eBay "shop this card" + PSA cert link

- **Ledger rows** now have a third icon (🛒) next to the sold-price search
  and detail icons — opens an active-listings eBay search for that exact
  card (sorted lowest price first), separate from the existing sold-comps
  search. This existed already as an "eBay active" link buried in the card
  detail's pricing panel — this surfaces the same thing one tap away from
  the Ledger, without digging into a card's pricing section first.
- **PSA cert link** — shows up in the card detail's pricing panel, but
  only for cards marked graded with PSA as the grading company. It's a
  link to PSA's public cert lookup page, not an automatic per-card lookup,
  because your data doesn't currently store the actual cert number — only
  grading company and grade. If you want it to jump straight to that
  card's specific cert page, that needs a new `cert_number` field added to
  the cards table (a real, small Supabase migration) plus an input on the
  add/edit form. Didn't want to add that silently since it's the one thing
  in this update that would touch your database schema.

## 4. Everything from v25 (unchanged this round)

Player watchlist (news/ticker highlighting, not score filtering), in-app
box scores instead of leaving the app, the music panel, and card hobby
news via RSS. See prior notes if you need a refresher — nothing about
these changed in this bundle.

## 5. Everything from v24 (unchanged this round)

True black + red dark theme, the scrolling ticker (scores + card moves +
trending news), Vault Ledger (replaced Trade), CardSight real year/brand
filters with a safe fallback, and the card-flip animation.

## Before you commit

1. Load the app normally — confirm existing collection/photos still render.
2. Home screen — confirm "Card of the day" shows a real card from the
   collection, and check if a milestone banner appears (it will the first
   time count/value crosses a threshold; safe to dismiss).
3. Hobby video panel loads and plays.
4. In the Ledger, tap the new 🛒 icon on a row — confirms it opens an eBay
   active-listings search for that specific card.
5. Open a graded PSA card's detail — confirm the "Verify on PSA" link
   appears in the pricing panel; open a raw or non-PSA graded card and
   confirm it does NOT appear.
6. Everything from the v25 checklist: music panel, hobby news relay,
   player watchlist, in-app box scores.
7. Everything from the v24 checklist: dark mode, ticker, Ledger metrics,
   pricing-research value history, CardSight narrowed search, card flip.

## Suggested commit

`Add card-of-the-day + milestones, hobby video panel, eBay shop-this-card icon, PSA cert link`
