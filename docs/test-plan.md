# Tourism Explorer 9000 — Per-step Offer Set QA Plan

## Scope
Validate adaptive per-step offer generation (4 missions each step), deterministic seeded behavior, Pip explanation/remediation, and feedback completeness.

## Manual + automated checklist

### TC-01: Run length end condition
**Check**: completing exactly 8 cases routes immediately to Game Complete.

### TC-02: Offer set size and composition
**Check**: every map render shows exactly 4 cards and role labels count as 2 Recommended, 1 Challenge, 1 Wildcard.

### TC-03: Offer set refresh cadence
**Check**: after each completed case + Return to Map, a new 4-mission offer set is generated.

### TC-04: No repeats of completed missions
**Check**: any mission in `completedMissionIds` is never offered again in the same run.

### TC-05: Determinism within fixed seed
**Check**: same `runSeed` and same sequence of decisions reproduces the same per-step offer sets.

### TC-06: Variation across new runs
**Check**: Start New Run produces a different `runSeed` and different step-1 offer set.

### TC-07: Hub variety constraint
**Check**: no single offer set contains 3 missions from the same hub (when alternatives exist).

### TC-08: Last-hub repetition avoidance
**Check**: generator avoids re-offering the same hub as `lastChosenHub` where viable.

### TC-09: issueType variety constraint
**Check**: offer set maintains issueType diversity and avoids over-concentration when alternatives exist.

### TC-10: Pip “why these cases” alignment
**Check**: Pip summary references current lowest category/variance/flags and per-mission reasons from the current offer set.

### TC-11: Pip remediation after two poor outcomes
**Check**: forced Pip state suggests 2 stabilizing missions and “Highlight these on map” emphasizes them without auto-routing.

### TC-12: Outcome feedback learning note
**Check**: choosing any option shows non-empty `learningNote` in Outcome Feedback.

### TC-13: Outcome feedback system insight
**Check**: choosing any option shows non-empty `systemInsight` sentence based on issueType + delta trade-offs.

### TC-14: Top Analyst lock messaging
**Check**: when gate is locked, Outcome Feedback shows `Top Analyst blocked because: ...`.

## Automated QA scripts

Run:

```bash
node docs/qa/offer-set-audit.mjs
```

The script verifies:
- offer set size is always 4
- role composition is exactly 2/1/1
- completed missions are excluded
- hub concentration guard (< 3 same-hub in one set)
- deterministic output for same seed+state
- variation across different seeds
