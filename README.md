# Tourism Explorer 9000

Tourism Explorer 9000 is an HTML5 simulation game for itch.io where players act as a tourism analyst balancing **Economic Capital, Sustainability, Cultural Inclusion, Hospitality, and Visitor Satisfaction** across multiple Tampa-area hotspots.

## What's New in This Iteration

- Multi-hotspot mission flow (Riverwalk, Ybor City Cultural District, Busch Gardens Visitor Strategy).
- Dynamic map rendering from `data/missions.json`.
- Smart Pip hints based on systems imbalance patterns.
- Finite budget mechanic: **100 Impact Points per hotspot**.
- Final **Game Complete** closure screen with totals, BII, analyst tier, and narrative summary.
- Responsive UI improvements up to 1200px width, better focus styling, and choice button animations.

## Mission Definitions

Missions now live in `data/missions.json` and are loaded dynamically at startup.

Each mission includes:
- `id`, `name`, `area`, `description`
- `exploration.brief`, `exploration.mediaLabel`, and `exploration.dataPoints`
- `options[]` with:
  - `id`
  - `title`
  - `description`
  - `impactCost`
  - `deltas` (category effects)
  - `feedback`

## Budget Mechanic: Impact Points

- Every hotspot starts with `impactBudgetPerHotspot = 100` (configurable in `js/scoring.js`).
- Selecting an option deducts `impactCost` from remaining hotspot budget.
- Decisions that exceed remaining Impact Points are blocked.
- BII includes budget-awareness through reserve penalties.

## Scoring + Rating Summary

Scoring is centralized in `js/scoring.js`:
- `computeBII(categories, budget, constants)`
- `computeVariance(categories)`
- `checkTopGate(categories, variance, budget, constants)`
- `classifyRating(BII, topGatePassed, constants)`

Editable constants include:
- Top-tier gate controls: `vMinCategoryTop`, `vMaxVarianceTop`, `vNoNegativesTop`
- BII model constants
- Impact budget constants and reserve thresholds
- Rating thresholds

### Top Analyst gate (hard mode)

`Top Analyst` is intentionally difficult and only available when **all** of the following are true:
- Every category is at least `2` (configurable via `vMinCategoryTop`).
- Category spread is tight (`variance <= 2`, configurable via `vMaxVarianceTop`).
- No category is negative when `vNoNegativesTop = true`.
- BII meets the top-tier threshold (`ratingThresholds.top`, default `92`).

This gate ensures top-tier ratings represent balanced systems performance, not just a high score driven by one or two categories.

### BII rebalance behavior

The current BII formula now:
- Applies a stronger penalty as variance rises.
- Adds a direct minimum-category effect so weak links materially reduce score quality.

Result: imbalanced portfolios still can score decently, but they are visibly downgraded versus balanced systems-thinking outcomes.

## Run Locally

Use a local server (required for JSON fetch calls):

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy to itch.io

1. Ensure `index.html` is at the root of upload contents.
2. Zip project contents (not a parent folder wrapper).
3. Upload as HTML5 project in itch.io.

Example:

```bash
zip -r tourism-explorer-9000.zip index.html css js data docs README.md
```

### Recommended itch.io Embed Viewport

Set the embed/game viewport to:
- **Width:** `1000`
- **Height:** `800`

This aligns with the intended layout and readability.

## Accessibility + UX Notes

- Keyboard-visible focus styles are enabled for all buttons and links.
- Choice cards include subtle transition/fade animation.
- Responsive layout supports narrow/mobile widths and scales up to 1200px.

## QA

See the expanded QA matrix in `docs/test-plan.md` for budget, Pip hint variants, end-state narrative checks, and multi-hotspot progression.
