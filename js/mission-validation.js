(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.TE9000MissionValidation = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CATEGORY_KEYS = ['economic', 'sustainability', 'culture', 'hospitality', 'satisfaction'];

<<<<<<< HEAD
=======
  function hasValidCorrectnessMarker(mission) {
    if (mission.correctOptionId) {
      return (mission.options || []).some(option => option.id === mission.correctOptionId);
    }
    const bestCount = (mission.options || []).filter(option => option.isBest === true).length;
    return bestCount === 1;
  }



>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
  function hasMeaningfulText(value) {
    return typeof value === 'string' && value.trim().length >= 3;
  }

  function validatePedagogyBlock(pedagogy, label, errors) {
    if (!pedagogy || typeof pedagogy !== 'object') {
      errors.push(`${label} is missing pedagogy metadata.`);
      return;
    }

    if (!Array.isArray(pedagogy.tags) || pedagogy.tags.length === 0) {
      errors.push(`${label}.tags must include at least one tag.`);
    }
<<<<<<< HEAD
    if (!Array.isArray(pedagogy.reinforces) || pedagogy.reinforces.length === 0) {
      errors.push(`${label}.reinforces must include at least one reinforcement target.`);
    }
    if (!Array.isArray(pedagogy.commonPitfalls) || pedagogy.commonPitfalls.length === 0) {
      errors.push(`${label}.commonPitfalls must include at least one pitfall.`);
    }
=======

    if (!Array.isArray(pedagogy.reinforces) || pedagogy.reinforces.length === 0) {
      errors.push(`${label}.reinforces must include at least one reinforcement target.`);
    }

    if (!Array.isArray(pedagogy.commonPitfalls) || pedagogy.commonPitfalls.length === 0) {
      errors.push(`${label}.commonPitfalls must include at least one pitfall.`);
    }

>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
    if (!hasMeaningfulText(pedagogy.difficulty)) {
      errors.push(`${label}.difficulty is required and must be meaningful.`);
    }
  }

  function validateImageMetadataBlock(block, label, errors, { optional = false } = {}) {
    if (!block) {
      if (!optional) errors.push(`${label} is missing.`);
      return;
    }

<<<<<<< HEAD
    if (!hasMeaningfulText(block.imagePath)) errors.push(`${label}.imagePath is required.`);
    if (!hasMeaningfulText(block.alt)) errors.push(`${label}.alt is required.`);
    if (!hasMeaningfulText(block.caption)) errors.push(`${label}.caption is required.`);
    if (!hasMeaningfulText(block.sourceLabel)) errors.push(`${label}.sourceLabel is required.`);
  }

  function validateStakeholders(stakeholders, label, errors) {
    if (!Array.isArray(stakeholders) || stakeholders.length < 3) {
      errors.push(`${label} must list at least 3 stakeholders.`);
      return;
    }

    stakeholders.forEach((stakeholder, index) => {
      const stakeholderLabel = `${label}[${index}]`;
      if (!hasMeaningfulText(stakeholder?.id)) errors.push(`${stakeholderLabel}.id is required.`);
      if (!hasMeaningfulText(stakeholder?.label)) errors.push(`${stakeholderLabel}.label is required.`);
      if (!hasMeaningfulText(stakeholder?.perspective)) errors.push(`${stakeholderLabel}.perspective is required.`);
    });
  }

  function validateEvidence(evidence, label, errors) {
    if (!Array.isArray(evidence) || evidence.length < 2) {
      errors.push(`${label} must list at least 2 evidence points.`);
      return;
    }

    evidence.forEach((item, index) => {
      const evidenceLabel = `${label}[${index}]`;
      if (!hasMeaningfulText(item?.id)) errors.push(`${evidenceLabel}.id is required.`);
      if (!hasMeaningfulText(item?.label)) errors.push(`${evidenceLabel}.label is required.`);
      if (!hasMeaningfulText(item?.detail)) errors.push(`${evidenceLabel}.detail is required.`);
    });
  }

  function validateOptions(options, label, errors) {
    if (!Array.isArray(options) || options.length !== 3) {
      errors.push(`${label} must contain exactly 3 options.`);
      return;
    }

    options.forEach((option, index) => {
      const optionLabel = `${label}[${index}]`;
      if (!hasMeaningfulText(option?.id)) errors.push(`${optionLabel}.id is required.`);
      if (!hasMeaningfulText(option?.title)) errors.push(`${optionLabel}.title is required.`);
      if (!hasMeaningfulText(option?.description)) errors.push(`${optionLabel}.description is required.`);
      if (!Number.isFinite(option?.cost ?? option?.impactCost)) errors.push(`${optionLabel}.cost is required.`);
      if (!hasMeaningfulText(option?.feedback)) errors.push(`${optionLabel}.feedback is required.`);
      if (!hasMeaningfulText(option?.learningNote)) errors.push(`${optionLabel}.learningNote is required.`);
      if (!hasMeaningfulText(option?.coachNote)) errors.push(`${optionLabel}.coachNote is required.`);

      if (!option?.deltas || typeof option.deltas !== 'object') {
        errors.push(`${optionLabel}.deltas is required.`);
      } else {
        CATEGORY_KEYS.forEach((category) => {
          if (!Number.isFinite(option.deltas[category])) {
            errors.push(`${optionLabel}.deltas.${category} must be numeric.`);
          }
        });
      }

      const stakeholderImpacts = option?.stakeholderImpacts || {};
      if (!Array.isArray(stakeholderImpacts.winners) || stakeholderImpacts.winners.length === 0) {
        errors.push(`${optionLabel}.stakeholderImpacts.winners must list at least one stakeholder.`);
      }
      if (!Array.isArray(stakeholderImpacts.losers) || stakeholderImpacts.losers.length === 0) {
        errors.push(`${optionLabel}.stakeholderImpacts.losers must list at least one stakeholder.`);
      }
    });
=======
    const imagePath = String(block.imagePath || '').trim();
    const alt = String(block.alt || '').trim();
    const caption = String(block.caption || '').trim();
    const sourceLabel = String(block.sourceLabel || '').trim();

    if (!imagePath) errors.push(`${label}.imagePath is required.`);
    if (!hasMeaningfulText(alt)) errors.push(`${label}.alt is required and must be meaningful.`);
    if (!hasMeaningfulText(caption)) errors.push(`${label}.caption is required and must be meaningful.`);
    if (!hasMeaningfulText(sourceLabel)) errors.push(`${label}.sourceLabel is required and must be meaningful.`);
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
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

<<<<<<< HEAD
      if (!hasMeaningfulText(mission?.id)) {
        errors.push(`${label} is missing id.`);
=======
      if (!mission?.id) {
        errors.push(`mission[${index}] is missing id.`);
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
      } else if (seenIds.has(mission.id)) {
        errors.push(`${label} has a duplicate id.`);
      } else {
        seenIds.add(mission.id);
      }

<<<<<<< HEAD
      if (!hasMeaningfulText(mission?.name)) errors.push(`${label}.name is required.`);
      if (!hasMeaningfulText(mission?.hub)) errors.push(`${label}.hub is required.`);
      if (!hasMeaningfulText(mission?.issueType)) errors.push(`${label}.issueType is required.`);
      if (!hasMeaningfulText(mission?.tourismDomain)) errors.push(`${label}.tourismDomain is required.`);
      if (!hasMeaningfulText(mission?.description)) errors.push(`${label}.description is required.`);
      if (!Array.isArray(mission?.learningObjectives) || mission.learningObjectives.length === 0) {
        errors.push(`${label}.learningObjectives must include at least one learning objective.`);
      }
      if (!Array.isArray(mission?.constraints) || mission.constraints.length === 0) {
        errors.push(`${label}.constraints must include at least one operational constraint.`);
      }
      if (!hasMeaningfulText(mission?.reflectionPrompt)) {
        errors.push(`${label}.reflectionPrompt is required.`);
      }

      const rubric = mission?.rationaleRubric || {};
      if (!hasMeaningfulText(rubric.stakeholderFocus)) errors.push(`${label}.rationaleRubric.stakeholderFocus is required.`);
      if (!hasMeaningfulText(rubric.evidenceUse)) errors.push(`${label}.rationaleRubric.evidenceUse is required.`);
      if (!hasMeaningfulText(rubric.tradeoffReasoning)) errors.push(`${label}.rationaleRubric.tradeoffReasoning is required.`);

      validatePedagogyBlock(mission?.pedagogy, `${label}.pedagogy`, errors);
      validateStakeholders(mission?.stakeholders, `${label}.stakeholders`, errors);
      validateEvidence(mission?.evidence, `${label}.evidence`, errors);
      validateOptions(mission?.options, `${label}.options`, errors);

      if (!mission?.exploration || !hasMeaningfulText(mission.exploration.brief)) {
        errors.push(`${label}.exploration.brief is required.`);
      }

      const media = mission?.media;
      if (!media || typeof media !== 'object') {
        errors.push(`${label}.media is required.`);
=======
      if (!mission?.hub) errors.push(`${label} is missing hub.`);
      if (!mission?.issueType) errors.push(`${label} is missing issueType.`);
      validatePedagogyBlock(mission?.pedagogy, `${label}.pedagogy`, errors);

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

        if (!hasMeaningfulText(option?.feedback)) {
          errors.push(`${optionLabel} is missing meaningful feedback.`);
        }

        if (!hasMeaningfulText(option?.learningNote)) {
          errors.push(`${optionLabel} is missing meaningful learningNote.`);
        }
      });

      const media = mission?.media;
      if (!media || typeof media !== 'object') {
        errors.push(`${label} is missing media metadata.`);
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
      } else {
        validateImageMetadataBlock(media.hero, `${label}.media.hero`, errors);
        validateImageMetadataBlock(media.thumbnail, `${label}.media.thumbnail`, errors);
        validateImageMetadataBlock(media.fallbackDistrictArt, `${label}.media.fallbackDistrictArt`, errors);
        validateImageMetadataBlock(media.evidenceChart, `${label}.media.evidenceChart`, errors, { optional: true });
      }

<<<<<<< HEAD
      const correctOptionId = mission?.correctOptionId;
      if (!hasMeaningfulText(correctOptionId)) {
        warnings.push(`${label} does not set correctOptionId; learning score will rely fully on rationale quality.`);
      } else if (!(mission.options || []).some((option) => option.id === correctOptionId)) {
        errors.push(`${label}.correctOptionId does not match any option id.`);
=======
      if (!hasValidCorrectnessMarker(mission)) {
        errors.push(`${label} must define a valid correctOptionId or exactly one isBest option.`);
>>>>>>> ea033dd51f9a8cbdb8d01403efc3877c6b86f04c
      }
    });

    return { warnings, errors };
  }

  return {
    CATEGORY_KEYS,
    validateMissions
  };
});
