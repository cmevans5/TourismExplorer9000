# Tourism Explorer 9000 — Storyline Variable Schema

## Naming Convention
- Prefix all custom variables with `v` for readability and grouping in Storyline.
- Use concise camel-case names with semantic clarity.

## Core Score Variables
| Variable | Type | Default | Purpose |
|---|---|---:|---|
| vEco | Number | 0 | Economic Capital token total. |
| vSustain | Number | 0 | Sustainability token total. |
| vCulture | Number | 0 | Cultural Inclusion token total. |
| vHosp | Number | 0 | Hospitality token total. |
| vSatisf | Number | 0 | Visitor Satisfaction token total. |
| vBII | Number | 0 | Balanced Impact Index (computed composite score). |

## Decision Tracking Variables
| Variable | Type | Default | Purpose |
|---|---|---:|---|
| vDecisionCount | Number | 0 | Total number of decisions made in the slice. |
| vCorrectCount | Number | 0 | Count of decisions classified as “strong” (design-defined). |
| vPoorStreak | Number | 0 | Consecutive poor outcomes counter. |
| vLastOutcomePoor | True/False | False | Stores whether most recent outcome is poor. |
| vCurrentOutcomePoor | True/False | False | Current decision’s poor/non-poor classification. |

## Pip and Mission State Variables
| Variable | Type | Default | Purpose |
|---|---|---:|---|
| vPipEnabled | True/False | False | True when Pip scaffold should display. |
| vPipShownThisTurn | True/False | False | Prevents duplicate Pip display within same flow. |
| vHotspotCompleted | True/False | False | Marks first completion of the hotspot. |
| vReplayUsed | True/False | False | Tracks whether one replay has already been consumed. |
| vMissionCompleted | True/False | False | True after second completion (or when prototype end condition is met). |

## Threshold and Rule Variables (editable constants)
| Variable | Type | Default | Purpose |
|---|---|---:|---|
| vMinCategory | Number | -2 | Minimum required per category for top rating eligibility. |
| vMaxVariance | Number | 6 | Maximum allowed spread (`max category - min category`) for balance eligibility. |
| vPoorThreshold | Number | 35 | BII value below which an outcome is considered poor. |
| vTopRatingThreshold | Number | 75 | Minimum BII needed to qualify for top rating (with gating rules). |
| vDevelopingThreshold | Number | 50 | Mid-level benchmark for dashboard banding. |
| vExemplaryThreshold | Number | 85 | High benchmark used for optional advanced banding. |

## Derived/Display Variables (optional but recommended)
| Variable | Type | Default | Purpose |
|---|---|---:|---|
| vCategoryMin | Number | 0 | Runtime minimum among 5 category totals. |
| vCategoryMax | Number | 0 | Runtime maximum among 5 category totals. |
| vBalanceSpread | Number | 0 | Runtime spread: `vCategoryMax - vCategoryMin`. |
| vTopRatingEligible | True/False | False | True only if gating constraints are satisfied. |
| vRatingBand | Text | At Risk | Text label for dashboard summary band. |

## Decision Option Delta Variables (optional abstraction)
Use fixed trigger adjustments directly, or store deltas in variables for easier tuning.

| Variable | Type | Default | Purpose |
|---|---|---:|---|
| vOptA_EcoDelta | Number | 3 | Option A delta for Economic Capital. |
| vOptA_SustainDelta | Number | -2 | Option A delta for Sustainability. |
| vOptA_CultureDelta | Number | -1 | Option A delta for Cultural Inclusion. |
| vOptA_HospDelta | Number | 1 | Option A delta for Hospitality. |
| vOptA_SatisfDelta | Number | 1 | Option A delta for Visitor Satisfaction. |
| vOptB_EcoDelta | Number | 1 | Option B delta for Economic Capital. |
| vOptB_SustainDelta | Number | 3 | Option B delta for Sustainability. |
| vOptB_CultureDelta | Number | 2 | Option B delta for Cultural Inclusion. |
| vOptB_HospDelta | Number | 1 | Option B delta for Hospitality. |
| vOptB_SatisfDelta | Number | 1 | Option B delta for Visitor Satisfaction. |
| vOptC_EcoDelta | Number | 2 | Option C delta for Economic Capital. |
| vOptC_SustainDelta | Number | -1 | Option C delta for Sustainability. |
| vOptC_CultureDelta | Number | -2 | Option C delta for Cultural Inclusion. |
| vOptC_HospDelta | Number | 2 | Option C delta for Hospitality. |
| vOptC_SatisfDelta | Number | 0 | Option C delta for Visitor Satisfaction. |

## Implementation Notes
- Keep all thresholds editable in Storyline variables (do not hard-code in slide text).
- Permit category totals to move below zero.
- Use `vCorrectCount` for instructional analytics/feedback framing (not only for scoring).
- Ensure variable references are identical across triggers and JavaScript helpers.
