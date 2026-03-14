(function () {
  const SCORING_CONSTANTS = {
    // Top-tier gate thresholds
    vMinCategoryTop: 1,
    vMaxVarianceTop: 3,
    vNoNegativesTop: true,

    // BII model
    baseCenter: 50,
    baseMultiplier: 4,
    minCategoryMultiplier: 4,
    variancePenaltyMultiplier: 6,

    // Impact Points (finite resource budget)
    impactBudgetPerHotspot: 100,
    budgetReserveTarget: 25,
    reservePenaltyMultiplier: 0.25,
    minAverageRemainingPerHotspot: 10,

    ratingThresholds: {
      bronze: 42,
      silver: 58,
      gold: 74,
      top: 88
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function valuesArray(categories) {
    return [
      categories.economic,
      categories.sustainability,
      categories.culture,
      categories.hospitality,
      categories.satisfaction
    ];
  }

  function computeVariance(categories) {
    const vals = valuesArray(categories);
    return Math.max(...vals) - Math.min(...vals);
  }

  function canAffordDecision(remainingImpactPoints, impactCost) {
    return remainingImpactPoints - impactCost >= 0;
  }

  function computeBII(categories, budget, constants = SCORING_CONSTANTS) {
    const vals = valuesArray(categories);
    const sum = vals.reduce((acc, num) => acc + num, 0);
    const minCategory = Math.min(...vals);
    const baseScore = clamp(constants.baseCenter + sum * constants.baseMultiplier, 0, 100);
    const variance = computeVariance(categories);

    // Balanced Impact Index (BII) rewards systems thinking:
    // 1) Base score still values total portfolio gains.
    // 2) A direct minimum-category term pulls score down when any one area lags.
    // 3) A strong variance penalty makes visible score loss when outcomes are uneven.
    //
    // Approximate outcomes (budget penalty omitted):
    // | Categories        | Variance | Min | Approx BII |
    // | 2/2/2/2/2         | 0        | 2   | ~98        |
    // | 3/2/2/2/1         | 2        | 1   | ~82        |
    // | 6/2/0/5/1         | 6        | 0   | ~54        |
    const minimumCategoryBonus = minCategory * constants.minCategoryMultiplier;
    const imbalancePenalty = variance * constants.variancePenaltyMultiplier;

    const reserveShortfall = Math.max(0, constants.budgetReserveTarget - (budget.remainingImpactPoints || 0));
    const budgetPenalty = reserveShortfall * constants.reservePenaltyMultiplier;

    const BII = clamp(baseScore + minimumCategoryBonus - imbalancePenalty - budgetPenalty, 0, 100);
    return { BII, baseScore, imbalancePenalty, budgetPenalty, variance, sum };
  }

  function checkTopGate(categories, variance, constants = SCORING_CONSTANTS) {
    const vals = valuesArray(categories);
    const minPass = vals.every(value => value >= constants.vMinCategoryTop);
    const variancePass = variance <= constants.vMaxVarianceTop;
    const noNegativePass = !constants.vNoNegativesTop || vals.every(value => value >= 0);

    return minPass && variancePass && noNegativePass;
  }

  function classifyRating(BII, topGatePassed, constants = SCORING_CONSTANTS) {
    if (BII < constants.ratingThresholds.bronze) return 'At Risk';
    if (BII < constants.ratingThresholds.silver) return 'Bronze Analyst';
    if (BII < constants.ratingThresholds.gold) return 'Silver Analyst';
    if (BII < constants.ratingThresholds.top) return 'Gold Analyst';
    return topGatePassed ? 'Top Analyst' : 'Gold Analyst (Gated)';
  }

  window.TE9000Scoring = {
    SCORING_CONSTANTS,
    computeBII,
    computeVariance,
    canAffordDecision,
    checkTopGate,
    classifyRating
  };
})();
