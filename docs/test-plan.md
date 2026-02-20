# Tourism Explorer 9000 — Mini QA Test Plan (Vertical Slice)

## Test Data Assumptions
- Initial category totals all `0`.
- Threshold defaults per scoring model.
- Option deltas as specified in trigger blueprint.

## Test Cases

### TC-01: Baseline Launch State
**Steps**
1. Launch project.
2. Open City Map.

**Expected Results**
- Hotspot is enabled.
- `vHotspotCompleted=False`, `vReplayUsed=False`, `vMissionCompleted=False`.
- Dashboard shows all category totals `0` and BII initialized (0 until first compute, or computed baseline if configured).

---

### TC-02: Option B Improves Balanced Profile
**Steps**
1. Enter hotspot.
2. Select Option B once.

**Expected Results**
- `vEco +1`, `vSustain +3`, `vCulture +2`, `vHosp +1`, `vSatisf +1`.
- BII increases into non-poor range (typically >= developing threshold in prototype mapping).
- `vCurrentOutcomePoor=False`, `vPoorStreak=0`.

---

### TC-03: Option A Tradeoff Lowers Sustainability/Culture
**Steps**
1. Reset state.
2. Select Option A once.

**Expected Results**
- `vEco +3`, `vSustain -2`, `vCulture -1`, `vHosp +1`, `vSatisf +1`.
- Negative category values are allowed and displayed.
- Balance spread increases relative to Option B pattern.

---

### TC-04: Option C Tradeoff Lowers Cultural Inclusion
**Steps**
1. Reset state.
2. Select Option C once.

**Expected Results**
- `vEco +2`, `vSustain -1`, `vCulture -2`, `vHosp +2`, `vSatisf +0`.
- `vCulture` may become negative and remain valid.
- BII reflects both sum and imbalance penalty.

---

### TC-05: Poor Streak Triggers Pip After 2 Consecutive Poor Outcomes
**Steps**
1. Play decisions that produce poor outcomes twice consecutively.
2. Click Continue from second feedback.

**Expected Results**
- After first poor: `vPoorStreak=1`, `vPipEnabled=False`.
- After second consecutive poor: `vPoorStreak=2`, `vPipEnabled=True`.
- Pip hint slide/layer appears before return to map.

---

### TC-06: Poor Streak Resets on Non-Poor Outcome
**Steps**
1. Produce one poor outcome.
2. Next run produce non-poor outcome.

**Expected Results**
- `vPoorStreak` resets to `0` after non-poor outcome.
- Pip does not trigger.

---

### TC-07: Top Rating Gate Blocks Imbalanced Win
**Steps**
1. Accumulate a high BII via repeated choices that create high spread or low minimum category.
2. View dashboard.

**Expected Results**
- If any category < `vMinCategory` OR spread > `vMaxVariance`, `vTopRatingEligible=False`.
- Rating shows `Proficient (Gated)` even when `vBII >= vTopRatingThreshold`.

---

### TC-08: Decision Counters Increment Correctly
**Steps**
1. Complete two decision attempts.
2. Inspect variables.

**Expected Results**
- `vDecisionCount` increments by 1 per decision.
- `vCorrectCount` increments only for designated strong option(s) (recommended Option B).

---

### TC-09: Replay-Once Logic
**Steps**
1. Complete hotspot first time and return to map.
2. Re-enter hotspot (replay).
3. Complete second time and return to map.

**Expected Results**
- After first completion: replay still enabled.
- After second completion: hotspot disabled.
- `vMissionCompleted=True` after replay completion.

---

### TC-10: Dashboard Refresh Accuracy
**Steps**
1. Make a decision.
2. Open Token Dashboard from feedback and from map.

**Expected Results**
- Same category totals and BII shown in both access points.
- `vRatingBand` consistent with thresholds.

## Exit Criteria
- All 10 test cases pass.
- No trigger loops, dead-end navigation, or inconsistent variable updates.
- Pip appears only when intended and never blocks progression.
