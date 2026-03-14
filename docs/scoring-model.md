# Tourism Explorer 9000 — Scoring Model (Balanced Impact Index)

## Editable Constants (set as Storyline variables)
- `vMinCategory = -2`
- `vMaxVariance = 6`
- `vPoorThreshold = 35`
- `vDevelopingThreshold = 50`
- `vTopRatingThreshold = 75`
- `vExemplaryThreshold = 85` (optional distinction within top range)

> These defaults are tuned for a short prototype (1 hotspot + 1 replay max) where score movement per decision is moderate.

## Category Inputs
The model uses five category totals:
- `vEco`
- `vSustain`
- `vCulture`
- `vHosp`
- `vSatisf`

Category totals may be positive or negative.

## Step 1: Compute Base Performance
1. Compute sum of categories:  
   `sum = vEco + vSustain + vCulture + vHosp + vSatisf`
2. Convert to a 0–100 prototype scale using a linear map centered around 0.  
   Recommended simple mapping for this slice:  
   `baseScore = clamp(50 + (sum * 5), 0, 100)`

Interpretation:
- Balanced positive totals lift score above 50.
- Negative totals can push score below 50.

## Step 2: Compute Balance Penalty
1. Compute:
   - `vCategoryMin = min(vEco, vSustain, vCulture, vHosp, vSatisf)`
   - `vCategoryMax = max(vEco, vSustain, vCulture, vHosp, vSatisf)`
   - `vBalanceSpread = vCategoryMax - vCategoryMin`
2. Apply penalty for imbalance:  
   `imbalancePenalty = max(0, (vBalanceSpread - 2) * 4)`

Interpretation:
- Small spread (0–2) has no penalty.
- Larger spread increasingly lowers BII, reinforcing systems thinking.

## Step 3: Compute Balanced Impact Index (BII)
`vBII = clamp(baseScore - imbalancePenalty, 0, 100)`

Plain-language definition:
- The BII reflects both overall impact and how evenly impact is distributed across the five categories.
- Over-investment in one area at the expense of others reduces BII.

## Step 4: Poor Outcome Rule
Set current outcome classification:
- If `vBII < vPoorThreshold`, then `vCurrentOutcomePoor = True`; else `False`.

Consecutive logic:
- If current outcome poor: `vPoorStreak = vPoorStreak + 1`
- Else: `vPoorStreak = 0`

Pip trigger:
- If `vPoorStreak >= 2`, set `vPipEnabled = True`.

## Step 5: Top Rating Constraint (Hard Gate)
A learner **cannot** receive the top rating unless ALL constraints are met:
1. `vBII >= vTopRatingThreshold`
2. Every category is at or above `vMinCategory`
3. `vBalanceSpread <= vMaxVariance`

Pseudo-rule:
`vTopRatingEligible = (vBII >= vTopRatingThreshold) AND (vCategoryMin >= vMinCategory) AND (vBalanceSpread <= vMaxVariance)`

If any condition fails, force non-top rating band even when BII is high.

## Suggested Rating Bands for Dashboard
- **At Risk**: `vBII < vPoorThreshold`
- **Developing**: `vPoorThreshold <= vBII < vDevelopingThreshold`
- **Proficient**: `vDevelopingThreshold <= vBII < vTopRatingThreshold`
- **Exemplary**: `vBII >= vTopRatingThreshold` AND `vTopRatingEligible = True`
- **Proficient (Gated)**: `vBII >= vTopRatingThreshold` but `vTopRatingEligible = False`

## Rationale for Learning Goal Alignment
This model operationalizes systems thinking by rewarding broad, balanced improvements and penalizing one-dimensional optimization. Learners are encouraged to coordinate economic, social, service, and sustainability priorities rather than maximizing a single category.
