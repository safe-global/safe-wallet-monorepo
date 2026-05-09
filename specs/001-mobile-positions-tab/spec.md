# Feature Specification: Mobile Positions Tab

**Feature Branch**: `001-mobile-positions-tab`  
**Created**: 2026-01-19  
**Status**: Draft  
**Input**: User description: "In the mobile app I want to add a positions tab, that would display the user's position with different DeFI protocols. The feature is already implemented on web and I would like to have feature parity on mobile. The user should see their positions and be able to swipe down to refresh them. When the user navigates to this tab for the first time we show our standard green spinner in the middle of the positions tab, once data is there we display it as on web. If the user scrolls down to refresh - we display the standard OS spinner indicator (don't hide the current data) and just update in place."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View DeFi Positions (Priority: P1)

A Safe wallet owner opens the mobile app to check their DeFi positions across various protocols (staking, lending, liquidity pools, etc.). They navigate to the Home screen and see a new "Positions" tab alongside existing "Tokens" and "NFTs" tabs. Tapping the Positions tab displays their positions grouped by protocol.

**Why this priority**: Core value proposition - users need to see their DeFi positions to understand their portfolio allocation and earnings. Without this, the feature provides no value.

**Independent Test**: Can be fully tested by opening the app with a Safe that has DeFi positions, tapping the Positions tab, and verifying positions are displayed grouped by protocol with correct values.

**Acceptance Scenarios**:

1. **Given** a Safe with positions in DeFi protocols, **When** the user taps the Positions tab, **Then** they see their positions grouped by protocol with protocol name, icon, and total value displayed
2. **Given** a Safe with positions in a protocol, **When** viewing that protocol's positions, **Then** each position displays: token icon, token name, balance amount with symbol, position type (Deposited/Staking/Debt/Locked/etc.), fiat value, and 24h change
3. **Given** a Safe with no DeFi positions, **When** the user taps the Positions tab, **Then** they see an empty state indicating no positions found

---

### User Story 2 - Initial Loading State (Priority: P1)

A user navigates to the Positions tab for the first time (or when data hasn't been fetched yet). While positions are loading, they see the app's standard green spinner centered in the tab area, indicating data is being fetched.

**Why this priority**: Essential for user experience - users need feedback that their action triggered data loading, preventing confusion or repeated taps.

**Independent Test**: Navigate to Positions tab with no cached data and verify the green spinner appears centered until data loads.

**Acceptance Scenarios**:

1. **Given** the user has not previously loaded positions data, **When** they tap the Positions tab, **Then** a green spinner appears centered in the tab content area
2. **Given** positions are loading, **When** data successfully loads, **Then** the spinner disappears and positions are displayed
3. **Given** positions are loading, **When** an error occurs, **Then** the spinner disappears and an error state is displayed

---

### User Story 3 - Pull-to-Refresh Positions (Priority: P2)

A user wants to refresh their positions to see the latest values. They pull down on the positions list to trigger a refresh. During the refresh, the existing data remains visible while the native OS refresh indicator shows at the top.

**Why this priority**: Secondary to initial display but critical for ongoing usage - users need to see up-to-date values, especially for yield-bearing positions.

**Independent Test**: With positions already displayed, pull down to refresh and verify: existing data stays visible, OS refresh indicator appears, data updates in place when complete.

**Acceptance Scenarios**:

1. **Given** positions are already displayed, **When** the user pulls down on the list, **Then** the native OS refresh indicator appears at the top
2. **Given** a refresh is in progress, **When** viewing the screen, **Then** the existing positions data remains visible (not replaced with loader)
3. **Given** a refresh completes successfully, **When** new data arrives, **Then** the positions update in place without any visual flash or reload
4. **Given** a refresh fails, **When** the error occurs, **Then** the existing data remains visible and an appropriate error indication is shown

---

### User Story 4 - Multiple Protocols Display (Priority: P2)

A user with positions across multiple DeFi protocols (e.g., Aave, Lido, Compound) views the Positions tab. Each protocol is displayed as a collapsible section showing the protocol's total value and individual positions.

**Why this priority**: Supports users with diverse DeFi activity, which is the target audience for this feature.

**Independent Test**: Load a Safe with positions in 3+ protocols and verify each protocol has its own section with correct grouping.

**Acceptance Scenarios**:

1. **Given** positions in multiple protocols, **When** viewing the Positions tab, **Then** each protocol is displayed as a separate collapsible section
2. **Given** a protocol section, **When** viewing it, **Then** it displays the protocol icon, protocol name, and aggregated fiat value
3. **Given** a protocol with multiple position types, **When** expanded, **Then** positions are grouped by type (e.g., "Steakhouse" group name)

---

### User Story 5 - 24h Change Help Info (Priority: P3)

A user sees a percentage change value on a position and wants to understand what it represents. On mobile, they tap the percentage change value and a bottom sheet appears explaining "24h change" - providing context about what the value means.

**Why this priority**: Enhances user understanding but not critical for core functionality. Web already has this via tooltip on hover.

**Independent Test**: View a position with a percentage change, tap on the percentage value, verify bottom sheet appears with "24h change" title and explanatory text.

**Acceptance Scenarios**:

1. **Given** a position with a 24h change value displayed, **When** the user taps on the percentage change, **Then** a bottom sheet modal appears with "24h change" as the title
2. **Given** the 24h change info sheet is open, **When** the user views the content, **Then** they see explanatory text about what the 24h change represents
3. **Given** the 24h change info sheet is open, **When** the user taps outside or swipes down, **Then** the sheet dismisses

---

### Edge Cases

- What happens when the positions API is unavailable? Display an error state with retry option.
- What happens when a Safe has hundreds of positions? The list should scroll smoothly and render efficiently.
- What happens when network connectivity is lost during refresh? Keep existing data visible, show brief error toast, hide refresh indicator.
- What happens when a position has missing token icon? Display a fallback icon.
- What happens when fiat values are unavailable? Display balance without fiat conversion.
- What happens when the feature flag for positions is disabled for the chain? The Positions tab should not be displayed.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a "Positions" tab in the Home screen between Tokens and NFTs tabs (tab order: Tokens, Positions, NFTs; header continues showing total token balance, unchanged)
- **FR-002**: System MUST fetch positions data from the same API endpoint used by the web app (positions endpoint or portfolio endpoint depending on chain configuration)
- **FR-003**: System MUST display positions grouped by protocol, showing protocol metadata (name, icon), total fiat value, and percentage of total positions value
- **FR-004**: System MUST display individual positions with: token icon, token name, balance (formatted with symbol), position type label, fiat value, and 24h fiat change percentage
- **FR-005**: System MUST show the standard green spinner (centered) during initial data loading
- **FR-006**: System MUST support pull-to-refresh using the native OS refresh indicator while keeping existing data visible
- **FR-007**: System MUST display an empty state when the Safe has no positions
- **FR-008**: System MUST display an error state when positions cannot be loaded, with a retry option
- **FR-009**: System MUST hide the Positions tab when the positions feature is not enabled for the current chain
- **FR-010**: System MUST convert position type values to human-readable labels (deposit → "Deposited", loan → "Debt", staked → "Staking", locked → "Locked", reward → "Reward", etc.)
- **FR-011**: System MUST poll for updated positions data at the standard polling interval (same as web)

### Key Entities _(include if feature involves data)_

- **Protocol**: A DeFi protocol (e.g., Aave, Lido) with metadata (name, icon) containing one or more position groups
- **PositionGroup**: A named group of positions within a protocol (e.g., "Steakhouse")
- **Position**: An individual position with token info, balance, fiat value, position type, and 24h change
- **TokenInfo**: Token metadata including name, symbol, decimals, logo URI, and token type

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view their DeFi positions within 3 seconds of tapping the Positions tab (initial load)
- **SC-002**: Pull-to-refresh completes within 5 seconds under normal network conditions
- **SC-003**: Position data displayed matches the web app exactly (feature parity)
- **SC-004**: Users can smoothly scroll through 50+ positions without frame drops or jank
- **SC-005**: 100% of position types display correct human-readable labels
- **SC-006**: The Positions tab is only visible on chains where the feature is enabled

## Clarifications

### Session 2026-01-19

- Q: When viewing Positions tab, what should the header display? → A: Keep showing total token balance (header unchanged across all tabs)
- Q: Should mobile display percentage of total next to each protocol's value? → A: Yes, show percentage alongside fiat value
- Q: Where should the Positions tab be placed? → A: Between Tokens and NFTs (order: Tokens, Positions, NFTs)
- Q: What is the default state of protocol sections? → A: Expanded by default (user can collapse)

## Assumptions

### Code Sharing Strategy

- Reusable business logic from the web positions feature (hooks, utilities, data transformations) will be extracted and moved to the shared `packages/utils` package
- The web app will be refactored to consume these shared utilities from `packages/utils` instead of local implementations
- Mobile-specific UI components remain in `apps/mobile`, web-specific UI components remain in `apps/web`
- This follows the established monorepo pattern for cross-platform code sharing

### Existing Infrastructure

- The existing positions RTK Query endpoint from the shared store package can be reused in the mobile app
- The mobile app already has necessary components (AssetsCard, FiatChange, Logo) that can be reused or adapted for positions display
- The polling interval constant is already defined and shared between web and mobile
- The feature flag check mechanism (useHasFeature) already exists in the mobile app
- Protocol sections will be expandable/collapsible, expanded by default (matching web behavior)
- The currency preference from settings will be used for fiat conversions
