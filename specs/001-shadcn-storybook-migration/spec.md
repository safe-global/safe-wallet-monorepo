# Feature Specification: Storybook Coverage Expansion

**Feature Branch**: `001-shadcn-storybook-migration`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "Comprehensive Storybook coverage for existing MUI components, MSW mocking infrastructure, and visual regression testing via Chromatic to enable designer collaboration"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Component Inventory & Story Coverage (Priority: P1)

As a developer working on the design system migration, I need a complete inventory of all existing components mapped to their required states and data dependencies, so that I can systematically create Storybook stories for each component with proper mocking.

**Why this priority**: Without a complete component map, the migration will be haphazard. This is the foundation for all subsequent work - we cannot create stories for components we haven't inventoried, and we cannot mock data we haven't identified.

**Independent Test**: Can be fully tested by running an audit script that produces a component inventory report showing: component count, story coverage percentage, and identified data dependencies per component.

**Acceptance Scenarios**:

1. **Given** the apps/web/src directory, **When** the inventory process runs, **Then** a complete list of all React components is produced with their file paths
2. **Given** a component inventory, **When** cross-referenced with existing stories, **Then** components without stories are clearly identified with a coverage percentage
3. **Given** a component file, **When** analyzed for dependencies, **Then** all hooks, API calls, and Redux selectors used by that component are documented

---

### User Story 2 - MSW Mock Database Infrastructure (Priority: P2)

As a developer creating Storybook stories, I need a comprehensive mock database that provides realistic data for all API endpoints and hooks, so that components can be rendered in isolation with production-like data.

**Why this priority**: Most components depend on data from hooks and API calls. Without proper mocking, stories either fail to render or show empty states. This unblocks the actual story creation work.

**Independent Test**: Can be fully tested by creating a sample story for a data-dependent component (e.g., a transaction list) that renders with mock data from MSW handlers.

**Acceptance Scenarios**:

1. **Given** the existing MSW handlers in config/test/msw/, **When** reviewed against actual API usage, **Then** missing endpoints are identified and documented
2. **Given** a component that uses the Safe Transaction Service API, **When** rendered in Storybook, **Then** MSW intercepts the request and returns realistic mock data
3. **Given** mock data requirements, **When** creating new handlers, **Then** handlers follow established patterns in the codebase and cover success, error, and loading states

---

### User Story 3 - Individual Component Stories (Priority: P3)

As a designer reviewing the design system, I need Storybook stories for every component showing all their visual states, so that I can verify the current implementation and plan future design system improvements.

**Why this priority**: Stories are the deliverable that enables designer collaboration. Once we have inventory (P1) and mocking (P2), we can systematically create stories.

**Independent Test**: Can be fully tested by running Storybook and navigating through the component hierarchy, verifying each component renders in its documented states.

**Acceptance Scenarios**:

1. **Given** a UI component, **When** a story is created, **Then** it shows default, hover, active, disabled, loading, and error states as applicable
2. **Given** a feature component, **When** a story is created, **Then** it renders with mocked data and shows primary user flows
3. **Given** any component story, **When** viewed in Storybook, **Then** it includes documentation of props, usage examples, and design notes

---

### User Story 4 - Page-Level Stories with Layout (Priority: P4)

As a designer reviewing full page designs, I need Storybook stories that render complete pages including sidebar and header, so that I can review the full user experience and catch layout issues.

**Why this priority**: Component-level stories show parts in isolation, but designers need to see how components work together in actual page layouts. This is essential for spotting spacing, alignment, and responsive issues.

**Independent Test**: Can be fully tested by viewing a page story in Storybook that includes the sidebar, header, and main content area with realistic data.

**Acceptance Scenarios**:

1. **Given** a page component (e.g., Dashboard), **When** rendered as a story, **Then** it includes the full layout with sidebar, header, and content
2. **Given** a page story, **When** the viewport is resized, **Then** responsive behavior is visible and matches production
3. **Given** multiple page stories, **When** navigating between them, **Then** shared layout elements (sidebar, header) remain consistent

---

### User Story 5 - Visual Regression Testing with Chromatic (Priority: P5)

As a developer making design changes, I need automated visual regression tests that catch unintended visual changes, so that I can confidently refactor components without breaking the design.

**Why this priority**: Once we have comprehensive story coverage, visual regression testing prevents regressions during the migration. This is the safety net that enables rapid iteration.

**Independent Test**: Can be fully tested by making a visual change to a component and verifying Chromatic detects and reports the change in CI.

**Acceptance Scenarios**:

1. **Given** a component with a story, **When** a PR modifies that component, **Then** Chromatic runs and captures visual snapshots
2. **Given** an unintended visual change, **When** Chromatic compares snapshots, **Then** the change is flagged for review before merge
3. **Given** an intentional visual change, **When** approved in Chromatic, **Then** the new baseline is accepted and future PRs compare against it

---

### User Story 6 - Family-Based Coverage Strategy (Priority: P6)

As a developer, I need the inventory tool to group components by family so I can track coverage at the family level instead of individual components, enabling a cleaner Storybook sidebar with ~50 entries instead of 330+ flat entries.

**Why this priority**: Component families (components in the same directory) are typically covered by a single story file with multiple exports. This approach keeps Storybook organized while still achieving comprehensive visual regression testing.

**Independent Test**: Can be fully tested by running `yarn workspace @safe-global/web storybook:inventory --family` and verifying it produces a grouped report showing family coverage instead of individual component coverage.

**Acceptance Scenarios**:

1. **Given** the apps/web/src directory, **When** the inventory runs with --family flag, **Then** components are grouped by their parent directory as families
2. **Given** a family with a story file, **When** story exports are counted, **Then** the family shows the correct number of exports
3. **Given** the family report, **When** coverage is calculated, **Then** families with stories covering multiple states are marked as "complete"

---

### Edge Cases

- What happens when a component has circular dependencies with other components?
  - Document the dependency and create stories for leaf components first, working up the tree
- How do we handle components that require wallet connection or blockchain state?
  - Create MSW handlers that mock Web3 provider responses and use Storybook decorators to inject mock wallet state
- What happens when a component relies on Next.js router or server-side features?
  - Use Storybook's Next.js framework integration which provides router mocking; document components requiring special handling
- How do we handle dynamic imports and lazy-loaded features?
  - Test both loading states and loaded states; use Storybook's async loading support

## Requirements _(mandatory)_

### Functional Requirements

**Component Inventory & Mapping**

- **FR-001**: System MUST produce an automated inventory of all React components in apps/web/src/
- **FR-002**: System MUST identify which components have existing Storybook stories
- **FR-003**: System MUST document data dependencies (hooks, API calls, Redux selectors) for each component
- **FR-004**: System MUST categorize components by type: UI primitives, common components, feature components, page components

**MSW Mocking Infrastructure**

- **FR-005**: System MUST extend existing MSW handlers to cover all API endpoints used by components
- **FR-006**: System MUST provide fixture-based mock data using real API responses from staging CGW for realistic test scenarios
- **FR-007**: System MUST support multiple mock scenarios: success, error, loading, empty states
- **FR-008**: System MUST mock Web3 provider responses for wallet-dependent components

**Storybook Stories**

- **FR-009**: Every component MUST have at least one Storybook story
- **FR-010**: Stories MUST demonstrate all significant visual states (default, hover, disabled, loading, error)
- **FR-011**: Stories MUST use MSW for data mocking, not inline mock data
- **FR-012**: Stories MUST include autodocs for automatic documentation generation
- **FR-013**: Interactive components MUST have stories demonstrating user interactions

**Page-Level Stories**

- **FR-014**: Page stories MUST render with full application layout (sidebar, header)
- **FR-015**: Page stories MUST support viewport testing for responsive design
- **FR-016**: Page stories MUST use Storybook decorators to provide layout wrapper

**Visual Regression Testing**

- **FR-017**: All stories MUST be included in Chromatic visual regression testing by default
- **FR-018**: System MUST allow opting out specific stories from visual testing via parameters
- **FR-019**: Visual regression MUST run on every PR as part of CI pipeline; PRs with visual changes MUST be blocked until reviewed
- **FR-020**: System MUST provide clear documentation for reviewing and approving visual changes
- **FR-021**: Intentional visual changes MUST be approved by a designer via Chromatic's in-PR review workflow before merge

**Family-Based Coverage**

- **FR-022**: Inventory tool MUST support a `--family` flag to group components by directory
- **FR-023**: Family grouping MUST count story exports (not just story files) to accurately measure coverage
- **FR-024**: Family coverage status MUST be reported as "complete", "partial", or "none"
- **FR-025**: Family report MUST include category breakdown with story export counts per category

### Key Entities

- **Component**: A React component with a file path, type (UI/common/feature/page), and list of data dependencies
- **Story**: A Storybook story file associated with a component, containing one or more story exports showing different states
- **Mock Handler**: An MSW request handler that intercepts API calls and returns mock data
- **Visual Baseline**: A Chromatic snapshot representing the approved visual state of a story

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of visually-rendered sidebar components have Storybook stories (critical for page-level stories)
- **SC-002**: 100% of visually-rendered components in /components/common/ have Storybook stories (excludes providers, HOCs, utility wrappers)
- **SC-003**: At least 80% of feature components have Storybook stories
- **SC-004**: At least 5 page-level stories exist demonstrating full layouts (Dashboard, Settings, Transactions, etc.)
- **SC-005**: All API endpoints used by components are covered by MSW handlers
- **SC-006**: Chromatic visual regression runs on every PR with less than 2% flaky test rate
- **SC-007**: New component PRs include Storybook stories as part of the definition of done
- **SC-008**: Designer can review any component's visual states in Storybook without developer assistance
- **SC-009**: Family-based coverage reports at least 50% of families as "complete" (have stories with multiple exports covering key states)

## Migration Strategy _(mandatory)_

### Phase 1: Foundation (Inventory & Infrastructure)

**Objective**: Establish infrastructure and complete component inventory

1. **Component Audit**
   - Run automated inventory of all components
   - Cross-reference with existing stories
   - Identify coverage gaps (currently 330 components, 14 stories = 4% coverage)
   - Categorize components by priority based on:
     - User-facing visibility
     - Complexity of data dependencies
     - Importance for page-level stories

2. **MSW Enhancement**
   - Audit existing handlers against actual API usage
   - Add missing endpoints using fixture-based handlers
   - Create mock data fixtures from staging CGW for realistic test scenarios
   - Document mocking patterns for team

### Phase 2: Sidebar & Critical Components

**Objective**: Complete story coverage for sidebar components (required for page stories)

1. **Current state**: 3 sidebar components, 0 have stories
2. **Priority**: These are critical for page-level stories
3. **Components**:
   - SafeHeaderInfo
   - MultiAccountContextMenu
   - QrModal

4. **Deliverable**: Each story includes all states and integrates with existing theme system

### Phase 3: Common & Balance Components

**Objective**: Story coverage for common and balance components

1. **Common components** (16 components, 4 stories - 25% coverage):
   - Tier 1: Address display, balance display, token amounts, copy buttons
   - Tier 2: Tables, lists, network indicators
   - Tier 3: Modals, toasts, errors, loading states

2. **Balance components** (10 components, 0 stories):
   - TokenAmount, FiatValue, TokenIcon, BalanceList
   - Use fixture handlers for realistic data

3. **Data mocking**: Leverage enhanced MSW infrastructure from Phase 1

### Phase 4: Feature Area Components

**Objective**: Story coverage for feature-specific components

1. **Priority by feature importance**:
   - Tier 1: Transactions (38 components), Dashboard (18 components)
   - Tier 2: Settings (14 components), Balance components
   - Tier 3: Feature components (4 components)

2. **Approach**: Work with feature teams to identify critical paths and states

### Phase 5: Page-Level Stories

**Objective**: Create full-page stories with layout

1. **Target pages**: Dashboard, Transaction list, Transaction details, Settings, Safe Apps
2. **Implementation**: Create layout decorator that wraps stories with sidebar/header
3. **Responsive testing**: Each page story tested at mobile, tablet, desktop viewports

### Phase 6: Visual Regression & CI

**Objective**: Production-ready visual testing pipeline

1. **Chromatic setup**: Configure project, set up GitHub integration
2. **Baseline capture**: Run initial capture for all stories
3. **CI integration**: Add Chromatic to PR workflow with required approval
4. **Documentation**: Team training on reviewing visual changes

## Recommended Starting Order

Based on analysis of the current codebase, here is the recommended order for creating stories:

### Immediate Priority (Start Here)

1. **Sidebar components** (3 components, 0 stories)
   - Critical for page-level stories later
   - Includes SafeHeaderInfo, MultiAccountContextMenu, QrModal

2. **Balance components** (10 components, 0 stories)
   - High user visibility
   - Core to the wallet experience

3. **Common components** (16 components, 4 stories)
   - Fill gaps in existing coverage
   - Focus on high-visibility components first

### Secondary Priority

4. **Dashboard components** (18 components, 1 story)
5. **Transaction components** (38 components, 0 stories)
6. **Settings components** (14 components, 0 stories)

## Clarifications

### Session 2026-01-29

- Q: Should Chromatic visual regression failures block PR merges? → A: Block PRs, require designer sign-off for intentional visual changes via Chromatic's in-PR review workflow
- Q: Should 100% coverage include internal helper components with no visual output? → A: Only visually-rendered components require stories; skip providers, HOCs, and utility wrappers

## Assumptions

- The existing Storybook configuration (Next.js framework, theme system, addons) is stable and suitable
- MUI components follow consistent patterns that allow templated story generation
- Designer collaboration will use Storybook's published URL for reviews
- Chromatic's free tier or existing plan provides sufficient snapshots for the project
- Future design system changes will happen incrementally after story coverage is complete

## Dependencies

- Chromatic account setup and GitHub integration
- Designer availability for component state documentation and review
- Team agreement on component priority order
- CI/CD pipeline access for adding Chromatic step

## Out of Scope

- Actual component refactoring from MUI to shadcn (this spec covers the preparation/documentation phase)
- Mobile app (apps/mobile) component stories
- E2E testing changes
- Performance optimization of Storybook build times
- Accessibility testing automation (can be added later)
