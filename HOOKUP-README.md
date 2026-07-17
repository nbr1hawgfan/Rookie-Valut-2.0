# Rookie Vault - Small Wins Update (v27)

This round is a reorganization, not new features: Home is now feeds + a
light personal touch, and all card-management content moved into Ledger.
No Supabase migration needed.

**Everything in this bundle is a ready-to-extract, drop-in replacement.**
`index.html` already has everything wired in — you don't need to hand-edit
anything. Just replace your existing files.

## Files in this bundle (replace all of these)

- `index.html` — Home trimmed down; stats grid, health grid, and Backup
  Center moved into Ledger; two redundant preview panels removed entirely;
  version tags bumped to v27
- `js/app.js` — removed the two render functions that only existed to
  populate the panels being removed (`renderRecentCards`,
  `renderHomeSetProgress`) and their now-dead element references; also
  cleaned up one orphaned `tradeView` reference left over from the v24
  Trade→Ledger rename that had gone unused ever since (harmless, but dead
  code, worth a mention since you care about this being right)
- `js/spotlight.js`, `js/video-feed.js`, `js/sports-feed.js`,
  `js/music-feed.js`, `js/hobby-news.js`, `js/cardsight-diagnostics.js` —
  unchanged this round
- `css/app.css`, `css/sports-feed.css`, `css/worlds.css`,
  `css/cardsight-diagnostics.css` — unchanged this round (nothing about
  the reorg needed new CSS; stats-grid/health-grid/backup-panel keep the
  same classes, just live in a different tab now)
- `sw.js` — bumped to v27

Keep as-is (not in this bundle): `js/config.js`

## What moved where

**Home now has, in order:** welcome card (with Add/Set Tracker/Card Show
Mode buttons), Card of the Day + milestones, then the four feeds (sports
ticker/news, music, hobby video, card hobby news). That's it — every
feed you two have added, plus one light personal card touch. Nothing here
requires "managing" anything.

**Moved into Ledger:** the stats grid (total cards, value, for trade,
rookies, autographs, graded), the health grid (numbered, missing values,
missing photos), and the full Backup Center (CSV/JSON/summary exports).
Ledger is now genuinely the one place for "how's the collection doing and
how do I maintain it" — which is exactly what you'd expect from a tab
called Ledger.

**Removed entirely, not moved:** the "Newest cards" preview and "Set
progress" preview that used to sit on Home. Both were smaller duplicates
of views that already exist one tap away — Collection already shows
everything sorted newest-first, and the Sets view (via "Set Tracker" on
the welcome card) already shows full set progress. No data or
functionality lost, just no more mini-copies competing for space on Home.

## A couple of technical notes, in case it matters later

- Every element that moved (stats, health, backup) kept its exact same
  `id` — the JavaScript that populates them doesn't know or care which tab
  they're sitting in, so none of that logic needed to change, only where
  the HTML lives.
- While going through this, I found one truly dead reference
  (`elements.tradeView`) that's been sitting unused in `app.js` since the
  Trade tab became the Ledger back in v24 — I'd renamed everything that
  actually did something at the time, but missed this one leftover
  declaration. It was never called anywhere, so it wasn't causing any bugs,
  just cleaned it up while I was in there.

## Before you commit

1. Load the app normally — confirm existing collection/photos still render.
2. Home — confirm it's now welcome card → spotlight → the four feeds, and
   nothing else. Scroll to the bottom to make sure nothing got cut off.
3. Ledger tab — scroll down past the card list and confirm the stats grid,
   health grid, and Backup Center all appear and show real numbers.
4. Test one backup export (CSV is the quickest) from its new home in
   Ledger to confirm the download still works.
5. Confirm "Set Tracker" on the Home welcome card still opens the full
   Sets view (this was always a separate button from the removed preview,
   should be unaffected, but worth a check).
6. Everything from prior checklists still applies if you want to re-verify
   the feeds, CardSight filters, card flip, etc. — nothing about those
   changed this round.

## Suggested commit

`Reorganize: Home is feeds + spotlight only, stats/health/backup moved into Ledger, removed redundant Home previews`
