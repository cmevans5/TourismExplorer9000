# Tourism Explorer 9000 — Expanded QA Test Plan

## Scope
This plan validates the next-iteration experience including:
- Multi-hotspot mission flow
- Impact Points budget constraints
- Pip adaptive hint variants
- Final Game Complete closure and narrative text

## Baseline Assumptions
- Initial category totals start at `0`.
- `impactBudgetPerHotspot = 100`.
- A hotspot is completed after one decision and feedback return.
- Pip appears after two consecutive poor outcomes (`net delta < 0`).

## Existing Core Checks (Legacy)
1. App launches and mission data loads from JSON.
2. Dashboard opens/closes and reflects current totals.
3. Category deltas update correctly after decision.
4. Local storage reset clears session state.

## New QA Cases (12)

### TC-11: Multi-Hotspot Map Rendering
**Steps**
1. Launch app.
2. Open map.

**Expected**
- Three hotspot cards are visible from JSON.
- Each hotspot has unique name/area and an Enter button.

---

### TC-12: Select Hotspot and Start Budget
**Steps**
1. From map, select any incomplete hotspot.
2. Open exploration then decision screen.

**Expected**
- `Impact Points Remaining` starts at `100`.
- Decision options display `impactCost` and affordability text.

---

### TC-13: Budget Deduction on Valid Decision
**Steps**
1. Enter Riverwalk.
2. Choose option A (`impactCost=40`).

**Expected**
- Remaining points become `60` for that hotspot.
- Feedback shows impact cost and remaining points.
- Total impact spent increments.

---

### TC-14: Budget Constraint Enforcement (Blocked Decision)
**Steps**
1. In any hotspot, set remaining points below a target option cost (via state setup or dev tools).
2. Attempt to select unaffordable option.

**Expected**
- Button is disabled OR alert explains insufficient Impact Points.
- No category deltas are applied.
- Decision count does not increment.

---

### TC-15: Pip Hint Variant — Sustainability Lowest
**Steps**
1. Make two consecutive poor outcomes where Sustainability becomes lowest category.
2. Trigger Pip overlay.

**Expected**
- Pip hint references environmental balance / sustainability actions.

---

### TC-16: Pip Hint Variant — Economic Too High
**Steps**
1. Produce state with Economic significantly above other categories.
2. Trigger Pip overlay after poor-streak condition.

**Expected**
- Pip hint references economic trade-off balancing with other categories.

---

### TC-17: Pip Hint Variant — Variance Above Threshold
**Steps**
1. Produce highly imbalanced category spread (`variance > vMaxVariance`).
2. Trigger Pip overlay.

**Expected**
- Pip hint references systems-balance / reducing category spread.

---

### TC-18: Complete First Hotspot and Return to Map
**Steps**
1. Finish one hotspot.
2. Return to map.

**Expected**
- Completed hotspot is tagged `Completed` and disabled.
- Remaining hotspots stay selectable.
- Mission completion count increments to `1/3`.

---

### TC-19: Full Multi-Hotspot Flow to Completion
**Steps**
1. Complete all three hotspots.
2. Return from last feedback.

**Expected**
- App transitions to `Game Complete` screen.
- No incomplete hotspots remain.

---

### TC-20: End Screen Metrics Accuracy
**Steps**
1. Complete all hotspots with known decisions.
2. Open Game Complete screen.

**Expected**
- Final category totals match cumulative deltas.
- Final BII and Analyst Tier appear.
- Narrative summary text is present.

---

### TC-21: End Screen Narrative (Imbalanced Outcome)
**Steps**
1. Complete game with strongly imbalanced categories.
2. Inspect narrative summary.

**Expected**
- Narrative explicitly mentions strongest area and under-supported category.

---

### TC-22: End Screen Narrative (High Performance)
**Steps**
1. Complete game with high BII and top-gate pass.
2. Inspect narrative summary.

**Expected**
- Narrative states resilient/strong system performance.
- Analyst tier reflects top-level outcome.

## Exit Criteria
- All 12 new test cases pass.
- No dead-end navigation between map → exploration → decision → feedback → map/complete.
- Budget constraints and Pip hint variants behave deterministically.
