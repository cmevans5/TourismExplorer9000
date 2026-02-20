(function () {
  const SCORING_CONSTANTS = {
    vMinCategory: 0,
    vMaxVariance: 8,
    baseCenter: 50,
    baseMultiplier: 5,
    imbalanceGrace: 2,
    imbalancePenaltyMultiplier: 4,
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

  function computeBII(categories, constants = SCORING_CONSTANTS) {
    const vals = valuesArray(categories);
    const sum = vals.reduce((acc, num) => acc + num, 0);
    const baseScore = clamp(constants.baseCenter + sum * constants.baseMultiplier, 0, 100);
    const variance = computeVariance(categories);
    const imbalancePenalty = Math.max(0, (variance - constants.imbalanceGrace) * constants.imbalancePenaltyMultiplier);
    const BII = clamp(baseScore - imbalancePenalty, 0, 100);
    return { BII, baseScore, imbalancePenalty, variance, sum };
  }

  function checkTopGate(categories, variance, constants = SCORING_CONSTANTS) {
    const vals = valuesArray(categories);
    const minCategory = Math.min(...vals);
    const minPass = minCategory >= constants.vMinCategory;
    const variancePass = variance <= constants.vMaxVariance;
    return minPass && variancePass;
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
    checkTopGate,
    classifyRating
  };
})();
