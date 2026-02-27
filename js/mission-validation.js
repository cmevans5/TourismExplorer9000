(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.TE9000MissionValidation = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CATEGORY_KEYS = ['economic', 'sustainability', 'culture', 'hospitality', 'satisfaction'];

  function hasValidCorrectnessMarker(mission) {
    if (mission.correctOptionId) {
      return (mission.options || []).some(option => option.id === mission.correctOptionId);
    }
    const bestCount = (mission.options || []).filter(option => option.isBest === true).length;
    return bestCount === 1;
  }

  function validateMissions(missions) {
    const warnings = [];
    const errors = [];

    if (!Array.isArray(missions)) {
      errors.push('missions must be an array.');
      return { warnings, errors };
    }

    const seenIds = new Set();

    missions.forEach((mission, index) => {
      const label = mission?.id || `mission[${index}]`;

      if (!mission?.id) {
        errors.push(`mission[${index}] is missing id.`);
      } else if (seenIds.has(mission.id)) {
        errors.push(`${label} has a duplicate id.`);
      } else {
        seenIds.add(mission.id);
      }

      if (!mission?.hub) errors.push(`${label} is missing hub.`);
      if (!mission?.issueType) errors.push(`${label} is missing issueType.`);

      if (!Array.isArray(mission?.options) || mission.options.length !== 3) {
        errors.push(`${label} must have exactly 3 options.`);
      }

      (mission.options || []).forEach((option, optionIndex) => {
        const optionLabel = `${label}:option[${optionIndex}]`;
        if (!option?.id) errors.push(`${optionLabel} is missing id.`);

        const optionCost = option?.cost ?? option?.impactCost;
        if (!Number.isFinite(optionCost)) {
          errors.push(`${optionLabel} is missing numeric cost/impactCost.`);
        }

        if (!option?.deltas || typeof option.deltas !== 'object') {
          errors.push(`${optionLabel} is missing deltas.`);
        } else {
          CATEGORY_KEYS.forEach(category => {
            if (!Number.isFinite(option.deltas[category])) {
              errors.push(`${optionLabel} has invalid delta for ${category}.`);
            }
          });
        }

        if (!String(option?.learningNote || '').trim()) {
          warnings.push(`${label}:${option?.id || optionIndex} missing learningNote.`);
        }
      });

      if (!hasValidCorrectnessMarker(mission)) {
        errors.push(`${label} must define a valid correctOptionId or exactly one isBest option.`);
      }
    });

    return { warnings, errors };
  }

  return {
    CATEGORY_KEYS,
    validateMissions
  };
});
