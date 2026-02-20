(function () {
  const SCORING_CONSTANTS = {
    // Balance thresholds
    vMinCategory: 0,
    vMaxVariance: 8,

    // BII model
    baseCenter: 50,
    baseMultiplier: 5,
    imbalanceGrace: 2,
    imbalancePenaltyMultiplier: 4,

    // Impact Points (finite resource budget)
    impactBudgetPerHotspot: 100,
    budgetReserveTarget: 20,
    reservePenaltyMultiplier: 0.25,
    minAverageRemainingPerHotspot: 10,

    ratingThresholds: {
      bronze: 35,
      silver: 55,
      gold: 75
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
    const baseScore = clamp(constants.baseCenter + sum * constants.baseMultiplier, 0, 100);
    const variance = computeVariance(categories);
    const imbalancePenalty = Math.max(0, (variance - constants.imbalanceGrace) * constants.imbalancePenaltyMultiplier);

    const reserveShortfall = Math.max(0, constants.budgetReserveTarget - (budget.remainingImpactPoints || 0));
    const budgetPenalty = reserveShortfall * constants.reservePenaltyMultiplier;

    const BII = clamp(baseScore - imbalancePenalty - budgetPenalty, 0, 100);
    return { BII, baseScore, imbalancePenalty, budgetPenalty, variance, sum };
  }

  function checkTopGate(categories, variance, budget, constants = SCORING_CONSTANTS) {
    const vals = valuesArray(categories);
    const minCategory = Math.min(...vals);
    const minPass = minCategory >= constants.vMinCategory;
    const variancePass = variance <= constants.vMaxVariance;

    const completedHotspots = Math.max(1, budget.completedHotspots || 1);
    const avgRemaining = (budget.totalRemainingImpactPoints || 0) / completedHotspots;
    const budgetPass = avgRemaining >= constants.minAverageRemainingPerHotspot;

    return minPass && variancePass && budgetPass;
  }

  function classifyRating(BII, topGatePassed, constants = SCORING_CONSTANTS) {
    if (BII < constants.ratingThresholds.bronze) return 'At Risk';
    if (BII < constants.ratingThresholds.silver) return 'Bronze Analyst';
    if (BII < constants.ratingThresholds.gold) return 'Silver Analyst';
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
