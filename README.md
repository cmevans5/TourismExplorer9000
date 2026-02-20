# Tourism Explorer 9000

Tourism Explorer 9000 is an HTML5 simulation game where players act as a tourism analyst balancing **Economic Capital, Sustainability, Cultural Inclusion, Hospitality, and Visitor Satisfaction** across adaptive Tampa-area decision cases.

## Mission Database (Adaptive Case Pool)

Missions are defined in `data/missions.json`. Each mission is now one decision case that can be sequenced by a recommender.

### Mission schema
Each mission contains:
- `id` (unique string)
- `name`
- `hub` (e.g., `Riverwalk`, `Ybor`, `BuschGardens`, `PortTampa`, `ConventionDistrict`, `Channelside`, `AirportCorridor`, `SouthShore`)
- `issueType` (`Mobility`, `Sustainability`, `CulturalInclusion`, `Hospitality`, `VisitorSatisfaction`, `Safety`, `Pricing`)
- `description`
- `pedagogy`
  - `tags[]` (for adaptive routing such as remediation/follow-up/variety)
  - `reinforces[]`
  - `commonPitfalls[]`
  - `difficulty`
- `prerequisites` (optional sequencing hooks)
  - `minDecisions`
  - `requiresFlag`
  - `excludesFlag`
- `exploration`
  - `brief`
  - `mediaLabel`
  - `bullets[]`
- `options[]` (A/B/C)
  - `id`
  - `title`
  - `description`
  - `cost`
  - `deltas`
  - `feedback`

## Hub + Case Coverage

The mission pool currently includes **18 cases** across **8 hubs**, with 2–3 cases per hub to support:
- remediation picks (target weak categories / high variance),
- consequence follow-ups (same hub, related issue),
- variety constraints (avoid repeating the same hub 3 times in a row).

## Scoring + Top Analyst Gate

Scoring is centralized in `js/scoring.js`:
- `computeBII(categories, budget, constants)`
- `computeVariance(categories)`
- `checkTopGate(categories, variance, budget, constants)`
- `classifyRating(BII, topGatePassed, constants)`

`Top Analyst` requires:
- all categories `>= 2`
- variance `<= 2`
- no negative categories
- BII meeting the top threshold.

## Run Locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## QA

See `docs/test-plan.md` and `docs/qa/mission-pool-audit.mjs` for mission-structure and achievability checks.
