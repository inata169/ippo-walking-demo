# observation-comparison Specification

## ADDED Requirements

### Requirement: Local video reference

The application SHALL allow the user to select one local video and display it beside the 3D view without uploading or persisting the video.

#### Scenario: Select a supported video

- **GIVEN** the application is open with a current 3D configuration
- **WHEN** the user selects a video that the browser can play
- **THEN** the video is displayed beside the 3D view
- **AND** the current 3D configuration is unchanged
- **AND** the UI states that the video remains on the device and is not saved in JSON

#### Scenario: Replace or close a video

- **GIVEN** a local video is displayed
- **WHEN** the user replaces or closes it
- **THEN** the application releases the prior temporary video URL
- **AND** preserves the current 3D configuration and observation fields

#### Scenario: Select an unsupported video

- **GIVEN** the application has a valid current state
- **WHEN** the selected video cannot be played by the browser
- **THEN** the application shows a non-technical error message
- **AND** does not change the valid current state

### Requirement: Observation phase navigation

The application SHALL provide six named observation positions for the affected-side step and SHALL treat them as illustrative model positions rather than measured clinical gait events.

#### Scenario: Move to an observation position

- **GIVEN** the 3D model is playing or stopped
- **WHEN** the user selects an observation position
- **THEN** playback stops
- **AND** the model moves to the configured cycle position
- **AND** the selected position is visibly identified

#### Scenario: Change affected side

- **GIVEN** an observation position is selected
- **WHEN** the affected side changes between left and right
- **THEN** the selected position is interpreted relative to the new affected side
- **AND** the position label remains understandable without requiring clinical terminology

#### Scenario: Compare at the same position

- **GIVEN** records A and B are available and an observation position is selected
- **WHEN** the user switches between A and B
- **THEN** both records are rendered at the same normalized cycle position
- **AND** playback remains stopped

### Requirement: Independent side adjustments

The application SHALL allow the affected side and the opposite side to be adjusted independently for step length, foot lift, knee bend, and support duration.

#### Scenario: Adjust only one side

- **GIVEN** valid values exist for both sides
- **WHEN** the user changes one value for one side
- **THEN** the corresponding value for the other side remains unchanged
- **AND** the 3D pose updates using the normalized value

#### Scenario: Use Ver.0.3-equivalent defaults

- **GIVEN** a new Ver.0.4 session without user changes
- **WHEN** the default gait is rendered
- **THEN** the new side-specific settings produce the Ver.0.3-equivalent appearance within the model's existing tolerances

#### Scenario: Keep a planted foot stationary

- **GIVEN** either side is in its support interval
- **WHEN** the gait cycle advances within that interval
- **THEN** that foot's world position remains fixed within numerical tolerance
- **AND** all generated pose coordinates remain finite

### Requirement: Structured subjective observation

The application SHALL store subjective experience separately from visible-motion configuration and SHALL use controlled choices without a free-text field.

#### Scenario: Record perceived burden

- **GIVEN** the user is editing an observation
- **WHEN** the user selects one or more body regions
- **THEN** the UI labels them as regions where the person feels burden or discomfort
- **AND** does not label them as calculated load, pressure, injury, or diagnosis

#### Scenario: Record an unknown experience

- **GIVEN** the user cannot judge ease, endurance, or a sensation
- **WHEN** the user chooses "分からない" or leaves an optional field unset
- **THEN** the application preserves that uncertainty
- **AND** does not convert it to a neutral or zero value

#### Scenario: Separate sensation from motion

- **GIVEN** a 3D configuration and a subjective observation exist
- **WHEN** either one is edited
- **THEN** its data is updated independently
- **AND** subjective choices do not automatically change the 3D pose
- **AND** 3D settings do not automatically infer subjective choices

### Requirement: Privacy-preserving observation record

The application SHALL export and import a versioned observation record using format `ippo-walking-record` without video or direct identifiers.

#### Scenario: Export a record

- **GIVEN** a valid 3D configuration and observation
- **WHEN** the user exports the record
- **THEN** the JSON contains only the whitelisted format, version, configuration, phase, and structured observation fields
- **AND** contains no video bytes, video path, video filename, name, patient ID, or free text

#### Scenario: Import a valid record

- **GIVEN** a valid `ippo-walking-record` version 1 file
- **WHEN** the user imports it
- **THEN** the whitelisted configuration, phase, and observation fields are restored
- **AND** unknown fields are discarded

#### Scenario: Reject an invalid record safely

- **GIVEN** the application has a valid current state
- **WHEN** an invalid, unsupported, out-of-range, or oversized record is imported
- **THEN** the file is rejected with an understandable message
- **AND** the current state remains unchanged

#### Scenario: Import a Ver.0.3 setting

- **GIVEN** a valid `ippo-walking-settings` version 1 file
- **WHEN** the user imports it in Ver.0.4
- **THEN** its configuration and phase are restored with Ver.0.4 defaults for fields that did not exist
- **AND** no subjective observation is fabricated

### Requirement: Longitudinal A/B comparison

The application SHALL compare two observation records under the same viewing conditions without judging improvement or deterioration.

#### Scenario: Load two records

- **GIVEN** two valid observation records
- **WHEN** the user assigns them to A and B
- **THEN** the application can switch their 3D poses at a shared cycle position, camera direction, and zoom
- **AND** displays their configuration and observation values in a comparison table

#### Scenario: Show a missing value

- **GIVEN** one record lacks an optional observation value
- **WHEN** the comparison table is displayed
- **THEN** the value is shown as "記録なし"
- **AND** is not displayed as zero, normal, or no symptom

#### Scenario: Avoid automatic judgment

- **GIVEN** A and B contain different settings or observations
- **WHEN** the differences are displayed
- **THEN** the application does not label either record as better, worse, improved, deteriorated, correct, or incorrect
- **AND** does not use good/bad color coding

### Requirement: Clinical limitation messaging

The application SHALL keep the limits of the illustrative model visible wherever video, subjective observations, or longitudinal comparison could be mistaken for measurement.

#### Scenario: View the comparison feature

- **GIVEN** the comparison UI is visible
- **WHEN** the user reviews A and B
- **THEN** the UI states that the application supports observation and conversation
- **AND** does not measure or diagnose gait, physical load, recovery, or risk

#### Scenario: View side-specific numeric settings

- **GIVEN** numeric adjustment values are displayed
- **WHEN** the user views their descriptions
- **THEN** the descriptions identify model centimeters, cycle percentages, or relative engineering values as applicable
- **AND** state that they are not clinical scales or recommended training targets

