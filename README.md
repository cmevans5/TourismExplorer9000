# Tourism Explorer 9000

Tourism Explorer 9000 is an HTML5 simulation game where players act as a tourism analyst balancing **Economic Capital, Sustainability, Cultural Inclusion, Hospitality, and Visitor Satisfaction** across adaptive Tampa-area decision cases.

## Per-step Offer Sets (Adaptive 8-Case Runs)

Each run now uses per-step adaptive offers:
- Exactly **8 completed cases per run** (`RUN_LENGTH = 8`).
- The map shows exactly **4 missions per step**.
- Each offer set contains **2 Recommended + 1 Challenge + 1 Wildcard**.
- After every completed case, the next 4-mission offer set is regenerated from updated state signals.
- Completed missions are never offered again in the same run.

### Controlled randomness and seeds
Offer generation uses deterministic seeded PRNG (Mulberry32) in `js/adaptation.js`.

- `RANDOMNESS_SEED_MODE = "run"` (default) creates a new seed per new run.
- `RANDOMNESS_WEIGHT = 0.2` allows near-top candidates to rotate in while preserving constraints.
- Within a run, replaying the same seed + decision path yields the same offer sets.
- Across new runs, seed changes produce different offer sequences.

## Pip coaching + remediation

Pip acts as explainer and remediation coach:
- **Ask Pip why these cases?** explains current needs (lowest category, variance, pitfall flags).
- Pip shows role-based mission reasoning from the current 4-mission offer set.
- After two consecutive poor outcomes, Pip suggests 2 stabilizing missions and offers **Highlight these on map** (no auto-routing).

## Outcome feedback improvements

Outcome Feedback now includes:
- option-specific `learningNote`
- rule-based `systemInsight`
- `Top Analyst blocked because: ...` when gate conditions are not met.

## Run lifecycle + persistence

Run state is persisted in localStorage, including:
- `runId`, `runSeed`
- `casesCompletedThisRun`
- `offerSetMissionIds`
- `offerSetRolesById`, `offerSetReasonsById`
- `completedMissionIds`
- `lastChosenHub`, `lastChosenIssueType`

Use **Start New Run** to reset progress and generate a fresh run.

## Mission Database (Adaptive Case Pool)

Missions are defined in `data/missions.json`.

### Mission schema
Each mission contains:
- `id` (unique string)
- `name`
- `hub`
- `issueType`
- `description`
- `pedagogy` (`tags[]`, `reinforces[]`, `commonPitfalls[]`, `difficulty`)
- `prerequisites`
- `exploration`
- `options[]` (A/B/C with cost, deltas, feedback, learningNote)

## Run Locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## QA

Run validation checks:

```bash
python3 -m json.tool data/missions.json
node --check js/app.js js/ui.js js/state.js js/scoring.js js/adaptation.js
node docs/qa/offer-set-audit.mjs
```
