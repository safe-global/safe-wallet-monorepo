/**
 * Type definitions for the Storybook component inventory system
 */

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
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/*.test.tsx',
  '**/*.test.ts',
  '**/*.spec.tsx',
  '**/*.spec.ts',
  '**/*.stories.tsx',
  '**/*.stories.ts',
  '**/index.ts',
  '**/index.tsx',
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
