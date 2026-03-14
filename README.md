# Tourism Explorer 9000

<<<<<<< HEAD
Tourism Explorer 9000 is now a browser-based academic prototype for college learners studying tourism, hospitality, destination management, and sustainable development. Players act as a junior destination strategy analyst working through four curated Tampa cases.

## Prototype Loop

Each case follows the same learning flow:

1. Briefing
2. Evidence review
3. Decision and rationale
4. Outcome, debrief, and reflection

The current prototype includes four Tampa-focused cases:

- Riverwalk mobility and curb management
- Ybor nightlife and cultural stewardship
- Port Tampa cruise dispersal
- Busch Gardens pricing transparency

## Learning Design

The prototype combines:

- tourism systems thinking
- situated learning
- experiential learning
- constructivist evidence interpretation
- scaffolded coaching through Pip

Learners are scored on two layers:

- destination performance through the Balance Index and category portfolio
- learning evidence through stakeholder selection, evidence use, trade-off reasoning, and end-of-run reflection

## Mission Schema

Each mission in `data/missions.json` now includes:

- `learningObjectives[]`
- `stakeholders[]`
- `evidence[]`
- `constraints[]`
- `reflectionPrompt`
- `rationaleRubric`
- `tourismDomain`

Each option includes:

- category deltas
- outcome feedback
- learning note
- coaching note
- stakeholder winners and losers
=======
Tourism Explorer 9000 is an HTML5 simulation game where players act as a tourism analyst balancing **Economic Capital, Sustainability, Cultural Inclusion, Hospitality, and Visitor Satisfaction** across adaptive Tampa-area decision cases.

## Per-step Offer Sets (Adaptive 8-Case Runs)

Each run now uses per-step adaptive offers:
- Exactly **8 completed cases per run** (`RUN_LENGTH = 8`).
- The map shows exactly **4 missions per step**.
- Each offer set contains **2 Recommended + 1 Challenge + 1 Wildcard**.
- The 4 cards are **display-shuffled each step** (seeded by `runSeed + casesCompletedThisRun`) while preserving role assignments and rationale per card.
- After every completed case, the next 4-mission offer set is regenerated from updated state signals.
- Completed missions are never offered again in the same run.

### Controlled randomness and seeds
Offer generation uses deterministic seeded PRNG (Mulberry32) in `js/adaptation.js`.

- `RANDOMNESS_SEED_MODE = "run"` (default) creates a new seed per new run.
- `RANDOMNESS_WEIGHT = 0.2` allows near-top candidates to rotate in while preserving constraints.
- Within a run, replaying the same seed + decision path yields the same offer sets and card display order for each step.
- Across new runs, seed changes produce different offer sequences.

## Pip coaching + remediation

Pip acts as explainer and remediation coach:
- **Ask Pip why these cases?** explains current needs (lowest category, variance, pitfall flags).
- Pip shows role-based mission reasoning from the current 4-mission offer set.
- After two consecutive poor outcomes, Pip suggests 2 stabilizing missions and offers **Highlight these on map** (no auto-routing).
- Anti-cheese nudge: after repeatedly selecting the same presentation label (A/B/C) across cases, Pip shows a one-time reminder on Map: **"Options are shuffled each case—choose based on trade-offs, not the letter."**

## Outcome feedback improvements

Outcome Feedback now includes:
- option-specific `learningNote` (always rendered with fallback text if missing)
- rule-based `systemInsight` (always returns a non-empty sentence)
- one-line `Trade-off Spotlight` sentence summarizing the largest upside/downside category trade-off
- `Top Analyst currently blocked because: ...` when gate conditions are not met.

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


### Mission authoring rules (merge-blocking expectations)
Contributors adding or editing missions should follow these rules before opening a PR:
- Keep player-facing default-visible text concise and readable (short sentences, avoid dense jargon).
- Avoid duplicate `feedback` or duplicate `learningNote` phrases across options in the same mission.
- Ensure option outcomes are contrastive (A/B/C should not have near-identical educational trade-offs).
- Keep player-facing voice conversational: avoid over-formal phrasing (for example, "moreover", "pursuant to", "in accordance with").
- Provide complete pedagogy metadata on every mission: `pedagogy.tags`, `pedagogy.reinforces`, `pedagogy.commonPitfalls`, `pedagogy.difficulty`.
- Provide complete media metadata for required blocks (`hero`, `thumbnail`, `fallbackDistrictArt`) including `imagePath`, `alt`, `caption`, and `sourceLabel`.
- Provide meaningful option coaching copy: each option must include non-empty `feedback` and `learningNote`.
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c

## Run Locally

```bash
<<<<<<< HEAD
python -m http.server 8000
=======
python3 -m http.server 8000
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
```

Then open `http://localhost:8000`.

<<<<<<< HEAD
## Core Validation

```bash
python -m json.tool data/missions.json
node --check js/app.js js/adaptation.js js/ui.js js/state.js js/scoring.js js/mission-validation.js
node docs/qa/validate-missions.mjs
```
=======
## QA

Run validation checks:

```bash
python3 -m json.tool data/missions.json
node --check js/app.js js/adaptation.js js/ui.js js/state.js js/scoring.js js/mission-validation.js
node docs/qa/validate-missions.mjs
node docs/qa/offer-set-audit.mjs
node docs/qa/anti-cheese-learning-audit.mjs
node docs/qa/prereq-audit.mjs
node docs/qa/mission-copy-audit.mjs
node docs/qa/ui-content-integrity-audit.mjs
```

`mission-copy-audit.mjs` is intentionally non-blocking for baseline cleanup; run `node docs/qa/mission-copy-audit.mjs --strict` to fail on warnings once content is clean.
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
