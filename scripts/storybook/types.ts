/**
 * Type Definitions
 *
 * Centralized TypeScript types for the storybook coverage system.
 *
 * Key types:
 * - ComponentEntry: Individual component with path, name, category, hasStory
 * - ComponentFamily: Group of components in same directory
 * - TopLevelGroup: High-level grouping (e.g., "Sidebar", "Dashboard")
 * - CoverageReport: Summary statistics
 *
 * Used by: All scripts in this directory
 */

/**
 * Represents a component family - a group of related components in the same directory
 * that are covered by a single story file with multiple exports
 */
export interface ComponentFamily {
  /** Family name (typically the directory name) */
  name: string
  /** Path to the family directory relative to apps/web/src */
  path: string
  /** Components belonging to this family */
  components: string[]
  /** Component entries in this family */
  componentEntries: ComponentEntry[]
  /** Story file path if exists */
  storyFile?: string
  /** Number of story exports in the story file */
  storyExports: number
  /** Story export names */
  storyExportNames: string[]
  /** Coverage status: complete (has stories), partial (some coverage), none */
  coverage: 'complete' | 'partial' | 'none'
  /** Category of the family */
  category: ComponentCategory
}

/**
 * Family coverage report summary
 */
export interface FamilyCoverageReport {
  /** Report generation timestamp */
  timestamp: string
  /** Total number of families */
  totalFamilies: number
  /** Number of families with at least one story */
  coveredFamilies: number
  /** Families with complete coverage */
  completeFamilies: number
  /** Family coverage percentage */
  familyCoveragePercent: number
  /** Total story exports across all families */
  totalStoryExports: number
  /** Breakdown by category */
  byCategory: FamilyCategoryCoverage[]
  /** All families sorted by coverage status */
  families: ComponentFamily[]
}

/**
 * Top-level component group that covers multiple families with one story
 */
export interface TopLevelGroup {
  /** Group name (e.g., "Sidebar", "Dashboard") */
  name: string
  /** Root path for this group */
  rootPath: string
  /** Category */
  category: ComponentCategory
  /** All families contained in this group */
  families: ComponentFamily[]
  /** Total components across all families */
  totalComponents: number
  /** Whether this group has a top-level story */
  hasStory: boolean
  /** Path to top-level story if exists */
  storyPath?: string
  /** Number of story exports */
  storyExports: number
  /** Coverage status */
  coverage: 'complete' | 'partial' | 'none'
}

/**
 * Top-level coverage report
 */
export interface TopLevelCoverageReport {
  /** Report generation timestamp */
  timestamp: string
  /** Total number of top-level groups */
  totalGroups: number
  /** Groups with stories */
  coveredGroups: number
  /** Coverage percentage */
  coveragePercent: number
  /** Total story exports */
  totalStoryExports: number
  /** Breakdown by category */
  byCategory: { category: ComponentCategory; total: number; covered: number; percentage: number }[]
  /** All groups */
  groups: TopLevelGroup[]
}

/**
 * Family coverage breakdown for a category
 */
export interface FamilyCategoryCoverage {
  /** Category name */
  category: ComponentCategory
  /** Total families in category */
  totalFamilies: number
  /** Families with stories */
  coveredFamilies: number
  /** Coverage percentage for category */
  percentage: number
  /** Total story exports in category */
  storyExports: number
}

/**
 * Represents a single component in the codebase
 */
export interface ComponentEntry {
  /** File path relative to apps/web/src */
  path: string
  /** Component name extracted from export */
  name: string
  /** Component category (ui, common, feature, sidebar, etc.) */
  category: ComponentCategory
  /** Whether a .stories.tsx file exists */
  hasStory: boolean
  /** Path to story file if exists */
  storyPath?: string
  /** Dependencies extracted from imports */
  dependencies: ComponentDependencies
  /** Priority score for story creation (higher = more important) */
  priorityScore: number
  /** Reasons for the priority score */
  priorityReasons: string[]
}

/**
 * Component categories for organization
 */
export type ComponentCategory =
  | 'ui' // shadcn/ui components
  | 'common' // Shared components (EthHashInfo, etc.)
  | 'feature' // Feature-specific components
  | 'sidebar' // Sidebar/navigation components
  | 'page' // Page-level components
  | 'layout' // Layout components
  | 'dashboard' // Dashboard widgets
  | 'transaction' // Transaction-related components
  | 'balance' // Balance/asset components
  | 'settings' // Settings components
  | 'other' // Uncategorized

/**
 * Component dependencies analysis
 */
export interface ComponentDependencies {
  /** Custom hooks used (useXxx) */
  hooks: string[]
  /** Redux selectors/actions used */
  redux: string[]
  /** API calls detected (fetch, useSWR, etc.) */
  apiCalls: string[]
  /** Other components imported */
  components: string[]
  /** External packages used */
  packages: string[]
  /** Whether component uses MSW-mockable APIs */
  needsMsw: boolean
  /** Whether component uses Redux state */
  needsRedux: boolean
  /** Whether component uses Web3/blockchain calls */
  needsWeb3: boolean
}

/**
 * Story information for a component
 */
export interface StoryInfo {
  /** Path to the story file */
  path: string
  /** Story variants (Default, Loading, Error, etc.) */
  variants: string[]
  /** Whether all expected states are covered */
  isComplete: boolean
  /** Missing states that should be added */
  missingStates: string[]
}

/**
 * Coverage report summary
 */
export interface CoverageReport {
  /** Report generation timestamp */
  timestamp: string
  /** Total number of components found */
  totalComponents: number
  /** Number of components with stories */
  componentsWithStories: number
  /** Coverage percentage */
  coveragePercentage: number
  /** Breakdown by category */
  byCategory: CategoryCoverage[]
  /** Components without stories, sorted by priority */
  uncoveredComponents: ComponentEntry[]
  /** Components with incomplete stories */
  incompleteStories: ComponentEntry[]
}

/**
 * Coverage breakdown for a category
 */
export interface CategoryCoverage {
  /** Category name */
  category: ComponentCategory
  /** Total components in category */
  total: number
  /** Components with stories */
  withStories: number
  /** Coverage percentage for category */
  percentage: number
}

/**
 * Scanner configuration options
 */
export interface ScannerOptions {
  /** Root directory to scan (default: apps/web/src) */
  rootDir?: string
  /** Patterns to exclude */
  excludePatterns?: string[]
  /** Whether to include test files */
  includeTests?: boolean
  /** Verbose logging */
  verbose?: boolean
}

/**
 * Priority scoring weights
 */
export interface PriorityWeights {
  /** Weight for shadcn/ui components */
  uiComponent: number
  /** Weight for sidebar components (critical for page stories) */
  sidebarComponent: number
  /** Weight for common components (high reuse) */
  commonComponent: number
  /** Weight for components used by many others */
  highDependents: number
  /** Weight for components needing MSW mocks */
  needsMsw: number
  /** Weight for feature components */
  featureComponent: number
}

/**
 * Expected states for different component types
 */
export const EXPECTED_STATES: Record<string, string[]> = {
  default: ['Default'],
  interactive: ['Default', 'Hover', 'Focus', 'Disabled'],
  async: ['Default', 'Loading', 'Error', 'Empty'],
  form: ['Default', 'Filled', 'Error', 'Disabled'],
  toggle: ['Default', 'Active', 'Disabled'],
}

/**
 * Default priority weights
 */
export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  uiComponent: 10,
  sidebarComponent: 15,
  commonComponent: 8,
  highDependents: 5,
  needsMsw: 3,
  featureComponent: 5,
}

/**
 * Patterns to exclude from scanning
 *
 * Note: index.tsx files are NOT excluded because many components use index.tsx
 * as their main component file. The scanner's component detection filters out
 * barrel exports by checking for PascalCase component definitions.
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/*.test.tsx',
  '**/*.test.ts',
  '**/*.spec.tsx',
  '**/*.spec.ts',
  '**/*.stories.tsx',
  '**/*.stories.ts',
  '**/index.ts', // Exclude .ts barrel exports, keep .tsx component files
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/types.ts',
  '**/types/**',
  '**/constants.ts',
  '**/constants/**',
  '**/utils.ts',
  '**/utils/**',
  '**/hooks/**',
  '**/services/**',
  '**/store/**',
  '**/styles/**',
]
