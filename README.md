# Tourism Explorer 9000 (HTML5 Vertical Slice)

A standalone browser game prototype for instructional use: learners act as a Tourism Analyst making trade-off decisions across five impact categories.

## Short Build Plan
1. Load one mission (`Tampa Riverwalk`) from JSON to keep content data-driven.
2. Render a map-first gameplay loop as a static single-page app.
3. Provide exploration context and one A/B/C decision node with multi-category deltas.
4. Compute Balanced Impact Index (BII) using centralized, editable constants.
5. Enforce systems-thinking gate logic for top rating eligibility.
6. Track poor-outcome streak and trigger Pip overlay at 2 consecutive poor outcomes.
7. Allow one replay of the same hotspot, then lock mission and show end screen.
8. Persist all game state in localStorage and provide reset controls.

## Project Structure
```
/
  index.html
  /assets/
    /img/
  /css/
    styles.css
  /js/
    app.js
    state.js
    scoring.js
    ui.js
  /data/
    missions.json
  README.md
```

## Run Locally
Because mission data is loaded from JSON, run with a simple local server.

Option A (Python 3):
```bash
python3 -m http.server 8000
```
Then open: `http://localhost:8000`

Option B (VS Code Live Server):
- Open folder in VS Code
- Start Live Server
- Open provided local URL

## Gameplay Loop
Map Hub → Hotspot Exploration → Decision (A/B/C) → Outcome feedback + token deltas → return to map → replay once → end screen.

## Scoring Model
Implemented in `js/scoring.js`.

- **computeBII(categories, constants)**
- **computeVariance(categories)**
- **checkTopGate(categories, variance, constants)**
- **classifyRating(BII, topGatePassed, constants)**

### Editable Constants (single source)
- `vMinCategory` (default `0`)
- `vMaxVariance` (default `8`)
- `baseCenter`, `baseMultiplier`
- `imbalanceGrace`, `imbalancePenaltyMultiplier`
- rating thresholds (`bronze`, `silver`, `gold`)

### Poor Outcome Definition (implemented consistently)
For this prototype, a decision is considered a **poor outcome** when:
- **net delta sum < 0**

This is applied in `js/app.js` during decision evaluation.

## Itch.io Packaging (HTML5)

> Note: ZIP files are intentionally excluded from version control. Generate the upload ZIP locally as a release artifact.
1. Confirm `index.html` is at the root of the upload contents.
2. Zip the **contents** of this project folder (do not nest an extra parent folder above `index.html`).
3. On itch.io, create/edit project → Upload new file → choose ZIP.
4. Mark project type as **HTML5** and save.

Example packaging command from project root:
```bash
zip -r tourism-explorer-9000.zip index.html assets css js data README.md
```

## Troubleshooting
### Blank screen
- Open browser dev tools Console for JS errors.
- Confirm all files exist in expected paths.
- Confirm `missions.json` is valid JSON.

### CORS / `file://` issue
- If you double-click `index.html`, `fetch('data/missions.json')` may fail due to browser security policy.
- Use a local server (e.g., `python3 -m http.server 8000`) instead.

## Mini QA Checklist (Expected Results)
1. Map loads with one hotspot (Tampa Riverwalk), initially available.
2. Dashboard opens/closes from top bar and shows category totals + BII.
3. Option A increases Economic/Hospitality and slightly lowers Sustainability.
4. Option B increases Sustainability/Cultural Inclusion and slightly lowers Economic.
5. Option C increases Visitor Satisfaction with small trade-offs in two categories.
6. Feedback panel always shows narrative consequence + delta summary + explicit poor outcome yes/no.
7. After two consecutive poor outcomes, Pip overlay appears and gives balancing hint.
8. Replay works once (second completion moves to end screen/locked state).
9. Category totals can be negative and persist after refresh.
10. Reset Game clears localStorage and returns to initial state after confirmation.
