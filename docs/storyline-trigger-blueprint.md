# Tourism Explorer 9000 — Storyline Trigger/Layer Blueprint

This blueprint is ordered for direct implementation in Articulate Storyline using standard triggers first.

## Global Setup (before slide-specific work)
1. Create all variables from `docs/variable-schema.md`.
2. Build shared player controls:
   - Dashboard button on key slides.
   - Return/Continue navigation buttons.
3. Decide whether Token Dashboard is a dedicated slide or reusable layer. (Layer is faster for slice.)

---

## A) City Map Slide

### Objects
- `btnHotspot1`
- `btnDashboard`
- `txtHotspotStatus`
- Optional lock/check icons

### Trigger Checklist
1. **WHEN:** Timeline starts  
   **WHAT:** Set `vPipShownThisTurn = False`  
   **CONDITIONS:** None.

2. **WHEN:** Timeline starts  
   **WHAT:** Change state of `btnHotspot1` to Normal  
   **CONDITIONS:** `vHotspotCompleted == False`.

3. **WHEN:** Timeline starts  
   **WHAT:** Change state of `btnHotspot1` to Normal (Replay)  
   **CONDITIONS:** `vHotspotCompleted == True` AND `vReplayUsed == False`.

4. **WHEN:** Timeline starts  
   **WHAT:** Change state of `btnHotspot1` to Disabled  
   **CONDITIONS:** `vHotspotCompleted == True` AND `vReplayUsed == True`.

5. **WHEN:** User clicks `btnHotspot1`  
   **WHAT:** Jump to slide `Hotspot Intro/Exploration`  
   **CONDITIONS:** `vMissionCompleted == False`.

6. **WHEN:** User clicks `btnDashboard`  
   **WHAT:** Show layer `Token Dashboard`  
   **CONDITIONS:** None.

---

## B) Hotspot Intro/Exploration Slide

### Objects
- Intro text
- Placeholder media
- Data callout boxes
- `btnProceedDecision`
- `btnDashboard`

### Trigger Checklist
1. **WHEN:** Timeline starts  
   **WHAT:** Set `vDecisionCount = vDecisionCount` (no-op optional marker; can omit)  
   **CONDITIONS:** None.

2. **WHEN:** User clicks `btnProceedDecision`  
   **WHAT:** Jump to slide `Decision`  
   **CONDITIONS:** None.

3. **WHEN:** User clicks `btnDashboard`  
   **WHAT:** Show layer `Token Dashboard`  
   **CONDITIONS:** None.

---

## C) Decision Slide (A/B/C)

### Objects
- `btnOptionA`, `btnOptionB`, `btnOptionC`
- Hidden technical layer or direct trigger stack per option

### Common Pre-Outcome Triggers (for each option click)
1. **WHEN:** User clicks option button  
   **WHAT:** Add `1` to `vDecisionCount`  
   **CONDITIONS:** None.

2. **WHEN:** User clicks option button  
   **WHAT:** Adjust category totals using option deltas  
   **CONDITIONS:** None.

#### Recommended Deltas
- **Option A:** `+3 Eco, -2 Sustain, -1 Culture, +1 Hosp, +1 Satisf`
- **Option B:** `+1 Eco, +3 Sustain, +2 Culture, +1 Hosp, +1 Satisf`
- **Option C:** `+2 Eco, -1 Sustain, -2 Culture, +2 Hosp, 0 Satisf`

3. **WHEN:** User clicks option button  
   **WHAT:** Execute scoring update logic (standard triggers or JS helper) to set:
   - `vCategoryMin`, `vCategoryMax`, `vBalanceSpread`
   - `vBII`
   - `vCurrentOutcomePoor`
   - `vTopRatingEligible`
   - `vRatingBand`  
   **CONDITIONS:** None.

4. **WHEN:** User clicks option button  
   **WHAT:** Update poor streak:
   - If `vCurrentOutcomePoor == True` → add 1 to `vPoorStreak`
   - If `vCurrentOutcomePoor == False` → set `vPoorStreak = 0`  
   **CONDITIONS:** As above.

5. **WHEN:** User clicks option button  
   **WHAT:** Set Pip status:
   - If `vPoorStreak >= 2` → `vPipEnabled = True`
   - Else keep/clear as needed (`False` recommended when streak reset)  
   **CONDITIONS:** As above.

6. **WHEN:** User clicks option button  
   **WHAT:** Update `vCorrectCount` (instructional definition)
   - If option is designated strong for scenario (recommended: Option B) add 1  
   **CONDITIONS:** Option-specific.

7. **WHEN:** User clicks option button  
   **WHAT:** Show corresponding feedback layer (`Feedback A/B/C`)  
   **CONDITIONS:** None.

---

## D) Feedback Layers (A, B, C)

### Objects
- Outcome text
- “View Dashboard” button
- “Continue” button

### Trigger Checklist
1. **WHEN:** Layer timeline starts  
   **WHAT:** Set `vLastOutcomePoor = vCurrentOutcomePoor`  
   **CONDITIONS:** None.

2. **WHEN:** User clicks `View Dashboard`  
   **WHAT:** Show layer `Token Dashboard`  
   **CONDITIONS:** None.

3. **WHEN:** User clicks `Continue`  
   **WHAT:** Jump to `Pip Hint` slide/layer  
   **CONDITIONS:** `vPipEnabled == True` AND `vPipShownThisTurn == False`.

4. **WHEN:** User clicks `Continue`  
   **WHAT:** Jump to `Return-to-Map Router` (or directly City Map)  
   **CONDITIONS:** `vPipEnabled == False` OR `vPipShownThisTurn == True`.

---

## E) Token Dashboard Layer (or Slide)

### Objects
- Numeric references for all five categories
- BII display (`vBII`)
- Rating band display (`vRatingBand`)
- Close button

### Trigger Checklist
1. **WHEN:** Layer timeline starts  
   **WHAT:** Refresh/calculation trigger (optional if already calculated on decision)  
   **CONDITIONS:** None.

2. **WHEN:** User clicks `Close`  
   **WHAT:** Hide this layer  
   **CONDITIONS:** None.

---

## F) Pip Hint Layer/Slide

### Objects
- Pip character art (placeholder)
- Hint text focused on balancing weak categories
- Continue button

### Trigger Checklist
1. **WHEN:** Timeline starts  
   **WHAT:** Set `vPipShownThisTurn = True`  
   **CONDITIONS:** None.

2. **WHEN:** Timeline starts  
   **WHAT:** Set `vPipEnabled = False`  
   **CONDITIONS:** None (prevents repetitive display loops).

3. **WHEN:** User clicks `Continue`  
   **WHAT:** Jump to `Return-to-Map Router` (or City Map)  
   **CONDITIONS:** None.

---

## G) Return-to-Map Router Logic

Use either a dedicated router slide or trigger stack at end of feedback/Pip.

### Trigger Checklist
1. **WHEN:** Timeline starts (router) OR end-of-flow action  
   **WHAT:** Set `vHotspotCompleted = True`  
   **CONDITIONS:** `vHotspotCompleted == False`.

2. **WHEN:** Timeline starts (router) OR end-of-flow action  
   **WHAT:** Set `vReplayUsed = True`  
   **CONDITIONS:** `vHotspotCompleted == True` AND `vReplayUsed == False`.

3. **WHEN:** Timeline starts (router) OR end-of-flow action  
   **WHAT:** Set `vMissionCompleted = True`  
   **CONDITIONS:** `vHotspotCompleted == True` AND `vReplayUsed == True`.

4. **WHEN:** Timeline starts (router) OR end-of-flow action  
   **WHAT:** Jump to `City Map`  
   **CONDITIONS:** None.

---

## Optional JavaScript Enhancement (recommended)
- Replace manual min/max/spread/BII/rating trigger chains with one JS trigger call after each decision.
- Keep option delta updates in standard Storyline triggers for transparency.
- JS should only compute derived scoring and write back outputs.

