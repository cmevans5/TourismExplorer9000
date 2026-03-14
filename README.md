# Tourism Explorer 9000

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

## Run Locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Core Validation

```bash
python -m json.tool data/missions.json
node --check js/app.js js/adaptation.js js/ui.js js/state.js js/scoring.js js/mission-validation.js
node docs/qa/validate-missions.mjs
```
