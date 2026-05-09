# Data Model: Component Inventory System

**Branch**: `001-shadcn-storybook-migration` | **Date**: 2026-01-29

## Entities

### ComponentEntry

Represents a single React component in the codebase.

```typescript
interface ComponentEntry {
  /** Unique identifier (file path relative to apps/web/src) */
  id: string

  /** Component name (PascalCase) */
  name: string

  /** Absolute file path */
  path: string

  /** Component category for prioritization */
  type: ComponentType

  /** Story file information */
  story: StoryInfo | null

  /** External dependencies that affect mocking requirements */
  dependencies: ComponentDependencies

  /** Calculated priority score (higher = more important) */
  priorityScore: number

  /** Whether this is a visually-rendered component (vs provider/HOC/utility) */
  isVisual: boolean

  /** Last modified timestamp for tracking changes */
  lastModified: Date
}

type ComponentType = 'ui' | 'common' | 'sidebar' | 'feature' | 'page' | 'transaction'
```

### StoryInfo

Story file metadata for coverage tracking.

```typescript
interface StoryInfo {
  /** Absolute path to story file */
  path: string

  /** Number of story exports (excluding meta) */
  storyCount: number

  /** Named exports (story names) */
  storyNames: string[]

  /** Whether story includes autodocs tag */
  hasAutodocs: boolean

  /** Whether story uses MSW handlers */
  usesMsw: boolean

  /** Last modified timestamp */
  lastModified: Date
}
```

### ComponentDependencies

Dependencies that affect how a component should be mocked in stories.

```typescript
interface ComponentDependencies {
  /** Custom hooks used (useX pattern) */
  hooks: HookDependency[]

  /** Redux selectors used */
  reduxSelectors: string[]

  /** API calls detected (fetch, useSWR, RTK Query) */
  apiCalls: ApiCallDependency[]

  /** Web3 dependencies (wallet, chain, signing) */
  web3: Web3Dependency[]

  /** Next.js router usage */
  usesRouter: boolean

  /** Components imported from other directories */
  componentImports: string[]
}

interface HookDependency {
  name: string
  source: string // Import path
  type: 'custom' | 'react' | 'external'
}

interface ApiCallDependency {
  endpoint: string | null // Extracted if determinable
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'UNKNOWN'
  source: 'fetch' | 'rtk-query' | 'swr' | 'axios'
}

interface Web3Dependency {
  type: 'wallet-connection' | 'chain-state' | 'transaction' | 'signing' | 'provider'
  source: string // Import or hook name
}
```

### CoverageReport

Aggregated coverage statistics.

```typescript
interface CoverageReport {
  /** Report generation timestamp */
  generatedAt: Date

  /** Branch name */
  branch: string

  /** Overall statistics */
  totals: CoverageStats

  /** Per-category breakdown */
  byType: Record<ComponentType, CoverageStats>

  /** Components without stories (sorted by priority) */
  uncovered: ComponentEntry[]

  /** Components with stories but missing states */
  partialCoverage: PartialCoverageEntry[]
}

interface CoverageStats {
  totalComponents: number
  visualComponents: number // Excludes providers/HOCs
  componentsWithStories: number
  storiesCount: number
  coveragePercent: number
}

interface PartialCoverageEntry {
  component: ComponentEntry
  missingStates: ('loading' | 'error' | 'empty' | 'disabled')[]
  suggestedStories: string[]
}
```

### MockScenario

Predefined mock data scenarios for consistent story states.

```typescript
interface MockScenario {
  /** Unique scenario identifier */
  id: string

  /** Human-readable name */
  name: string

  /** Description of what this scenario represents */
  description: string

  /** MSW handlers for this scenario */
  handlers: MswHandler[]

  /** Redux state overrides */
  storeState?: Partial<RootState>

  /** Web3 mock configuration */
  web3Config?: MockWeb3Config
}

interface MswHandler {
  method: 'get' | 'post' | 'put' | 'delete'
  path: string // URL pattern with wildcards
  response: unknown | ((req: Request) => unknown)
  status?: number
  delay?: number // For loading state simulation
}

interface MockWeb3Config {
  isConnected: boolean
  chainId: number
  address?: string
  balance?: string
}
```

## Relationships

```
ComponentEntry 1----0..1 StoryInfo
     |
     |---- ComponentDependencies
              |
              |---- HookDependency[]
              |---- ApiCallDependency[]
              |---- Web3Dependency[]

CoverageReport ----* ComponentEntry (uncovered)
              ----* PartialCoverageEntry

MockScenario ----* MswHandler
```

## State Transitions

### Component Coverage States

```
[No Story] --> [Has Story] --> [Complete Coverage]
                    |
                    v
            [Partial Coverage]
                    |
                    v
            [Complete Coverage]
```

### Story Review States (Chromatic)

```
[Pending] --> [Changes Detected] --> [Approved]
                     |
                     v
              [Changes Rejected] --> [Fixed] --> [Approved]
```

## Validation Rules

1. **ComponentEntry.id**: Must be unique across the inventory
2. **ComponentEntry.name**: Must match PascalCase React component naming
3. **ComponentEntry.type**: Must be derived from file path:
   - `ui`: `/components/ui/`
   - `common`: `/components/common/`
   - `sidebar`: `/components/sidebar/`
   - `feature`: `/features/*/`
   - `page`: `/pages/` or page-level components
   - `transaction`: `/components/tx/` or `/components/transactions/`
4. **StoryInfo.storyCount**: Must be ≥ 1
5. **CoverageReport.coveragePercent**: Must be 0-100
6. **MockScenario.handlers**: Must have at least one handler

## Priority Scoring Algorithm

```typescript
function calculatePriority(component: ComponentEntry): number {
  let score = 0

  // Base score by type
  const typeScores: Record<ComponentType, number> = {
    ui: 100, // Foundation components
    common: 80, // Shared across features
    sidebar: 70, // Critical for page stories
    page: 60, // Full page layouts
    transaction: 50, // Transaction-specific
    feature: 40, // Feature-specific
  }
  score += typeScores[component.type]

  // Boost for fewer dependencies (easier to mock)
  const depCount =
    component.dependencies.hooks.length + component.dependencies.apiCalls.length + component.dependencies.web3.length
  score += Math.max(0, 30 - depCount * 5)

  // Boost for visual components
  if (component.isVisual) {
    score += 20
  }

  // Penalty for already having a story (deprioritize)
  if (component.story) {
    score -= 50
  }

  return score
}
```

## Index Structure

For efficient querying:

1. **By Type Index**: `Map<ComponentType, ComponentEntry[]>`
2. **Coverage Index**: `Map<'covered' | 'uncovered', ComponentEntry[]>`
3. **Priority Queue**: `PriorityQueue<ComponentEntry>` sorted by `priorityScore`
4. **Path Lookup**: `Map<string, ComponentEntry>` for file path → component
