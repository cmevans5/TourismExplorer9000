# Tourism Explorer 9000 — Optional JavaScript Helpers

Use this only to simplify scoring and balance calculations after option selection.

## Where to Attach in Storyline
- On Decision slide, for each option button (`A/B/C`):
  1. Run standard triggers to adjust category totals and `vDecisionCount`.
  2. Add trigger: **Execute JavaScript** (paste helper script below).
  3. Then show feedback layer.

This order ensures JS reads updated category totals.

## JS Helper: Compute BII, Balance, Poor Outcome, and Rating Band
```javascript
var player = GetPlayer();

function getNum(name){ return Number(player.GetVar(name) || 0); }
function setVar(name,val){ player.SetVar(name,val); }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

// Inputs
var eco = getNum("vEco");
var sustain = getNum("vSustain");
var culture = getNum("vCulture");
var hosp = getNum("vHosp");
var satisf = getNum("vSatisf");

// Threshold constants from Storyline vars
var minCategoryReq = getNum("vMinCategory");
var maxVarianceReq = getNum("vMaxVariance");
var poorThreshold = getNum("vPoorThreshold");
var developingThreshold = getNum("vDevelopingThreshold");
var topThreshold = getNum("vTopRatingThreshold");
var exemplaryThreshold = getNum("vExemplaryThreshold");

// Derived category stats
var arr = [eco, sustain, culture, hosp, satisf];
var cMin = Math.min.apply(null, arr);
var cMax = Math.max.apply(null, arr);
var spread = cMax - cMin;

// BII calculation
var sum = eco + sustain + culture + hosp + satisf;
var baseScore = clamp(50 + (sum * 5), 0, 100);
var imbalancePenalty = Math.max(0, (spread - 2) * 4);
var bii = clamp(baseScore - imbalancePenalty, 0, 100);

// Classification
var currentPoor = bii < poorThreshold;

// Top-rating eligibility gate
var topEligible = (
  bii >= topThreshold &&
  cMin >= minCategoryReq &&
  spread <= maxVarianceReq
);

// Rating band text
var rating = "At Risk";
if (bii >= poorThreshold && bii < developingThreshold) {
  rating = "Developing";
} else if (bii >= developingThreshold && bii < topThreshold) {
  rating = "Proficient";
} else if (bii >= topThreshold) {
  rating = topEligible ? "Exemplary" : "Proficient (Gated)";
}

// Write back
setVar("vCategoryMin", cMin);
setVar("vCategoryMax", cMax);
setVar("vBalanceSpread", spread);
setVar("vBII", Math.round(bii));
setVar("vCurrentOutcomePoor", currentPoor);
setVar("vTopRatingEligible", topEligible);
setVar("vRatingBand", rating);

// Poor streak + Pip
var poorStreak = getNum("vPoorStreak");
poorStreak = currentPoor ? (poorStreak + 1) : 0;
setVar("vPoorStreak", poorStreak);
setVar("vPipEnabled", poorStreak >= 2);
```

## Implementation Notes
- Keep this script identical across all three option buttons.
- If Storyline project settings disallow modern syntax in your environment, convert `let/const` to `var` (already done above for compatibility).
- Use Storyline triggers for visible navigation; use JS only for calculation.
