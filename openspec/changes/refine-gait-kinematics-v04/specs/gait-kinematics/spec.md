## ADDED Requirements

### Requirement: Coordinated gait posture
The model SHALL coordinate trunk, pelvis, legs and feet through the gait cycle, with fixed segment lengths and no ground penetration. It SHALL describe its coefficients as illustrative, not clinically validated dynamics.

#### Scenario: Baseline walking
- WHEN all feature amounts are zero
- THEN the trunk and feet move continuously with the gait phase, with modest forward inclination and reachable leg chains.

### Requirement: Graded symptom controls
The model SHALL provide gradual changes across the full slider range.

#### Scenario: Knee control
- WHEN knee hyperextension is changed through 0, 10, 20, 50 and 100 at affected mid stance
- THEN the signed knee angle decreases monotonically without the old immediate pelvis-height jump or an early plateau.

#### Scenario: Shorter affected support
- WHEN reduced support increases
- THEN affected stance decreases and opposite stance increases, the timeline shows their durations, and at least one foot remains in contact throughout the cycle.

#### Scenario: Toe clearance
- WHEN toe difficulty increases during mid swing
- THEN the foot points progressively downwards and its sole clearance decreases without penetration.

### Requirement: Meaningful observation phases
Phase selection SHALL follow the configured affected stance duration while A/B comparison preserves the same absolute cycle.

#### Scenario: Changed stance duration
- WHEN the user selects foot off after shortening affected stance
- THEN playback pauses at the updated transition into swing.


### Requirement: Smooth neutral load acceptance
The neutral gait SHALL use continuous pelvis and ankle trajectories without a support-weight-driven drop or an absolute-value velocity cusp. Fixed limb lengths and ground clearance SHALL be preserved.

#### Scenario: Neutral walking around 10% and 60%
- WHEN every feature amount is zero
- THEN the pelvis descends and rises gradually through load acceptance, and knees move without sudden changes of velocity, including the swing-foot horizontal crossing.

#### Scenario: Regression measurement
- WHEN trajectories are differentiated at two decreasing time steps
- THEN neutral knee acceleration remains bounded across the full cycle and pelvis speed/acceleration remain bounded around both load-acceptance windows.
