# Tourism Explorer 9000

Tourism Explorer 9000 is an HTML5 simulation game where players act as a tourism analyst balancing **Economic Capital, Sustainability, Cultural Inclusion, Hospitality, and Visitor Satisfaction** across adaptive Tampa-area decision cases.

## Tourism Sampling (Adaptive 8-Case Runs)

Each run now uses **Tourism Sampling**:
- Exactly **8 cases per run** (`RUN_LENGTH = 8`).
- Sample includes recommendation-weighted cases plus challenge and wildcard cases for replayability.
- Controlled randomness is used so runs differ while still respecting adaptive logic.
- The active map only displays the sampled cases for that run.

### Controlled randomness and seeds
Sampling uses a deterministic seeded PRNG (Mulberry32) in `js/adaptation.js`.

- `RANDOMNESS_SEED_MODE = "run"` (default) creates a new seed per new run.
- `RANDOMNESS_WEIGHT = 0.25` controls how often lower-ranked but valid missions are swapped in.
- Within a run, sampling is stable (same sampled mission IDs).

## Pip coaching + remediation

Pip now acts as both explainer and remediation coach:
- **Ask Pip why these cases?** button on Map explains why this sampled set appears.
- Pip explanation references weakest category, variance pressure, pitfall flags, and the Tourism Sampling principle.
- Pip includes a keyboard-accessible **“Why am I seeing this?”** expandable logic section.
- After poor streak triggers, Pip shows:
  - Diagnosis (lowest categories, variance, flags, recommended focus)
  - Remediation Plan (up to 2 missions from the sampled set)
  - **Take me there** button routing directly to top remediation mission.

## Run lifecycle + persistence

Run state is persisted in localStorage, including:
- `runId`, `runSeed`
- `casesCompletedThisRun`
- `sampledMissionIds`
- `completedMissionIds`
- `lastMissionId`, `lastMissionTags`

Use **Start New Run** to reset progress and re-sample a new run.

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
- `options[]` (A/B/C with cost, deltas, feedback)

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
node docs/qa/tourism-sampling-audit.mjs
```
