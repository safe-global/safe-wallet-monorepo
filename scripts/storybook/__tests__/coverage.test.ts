import type { ComponentEntry, StoryInfo } from '../types'
import {
  analyzeStoryCoverage,
  calculateCoverageStats,
  getCoverageByCategory,
  getUncoveredComponents,
  getIncompleteComponents,
} from '../coverage'

// Mock fs and typescript modules
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}))

jest.mock('typescript', () => ({
  createSourceFile: jest.fn(),
  forEachChild: jest.fn(),
  ScriptTarget: { Latest: 99 },
  isVariableStatement: jest.fn(() => false),
  getModifiers: jest.fn(() => []),
  SyntaxKind: { ExportKeyword: 93 },
  isIdentifier: jest.fn(() => false),
}))

const mockFs = jest.mocked(require('fs'))
const mockTs = jest.mocked(require('typescript'))

/**
 * Creates a mock component entry for testing
 */
function createMockComponent(overrides: Partial<ComponentEntry> = {}): ComponentEntry {
  return {
    path: 'components/common/Test.tsx',
    name: 'Test',
    category: 'common',
    hasStory: false,
    dependencies: {
      hooks: [],
      redux: [],
      apiCalls: [],
      components: [],
      packages: [],
      needsMsw: false,
      needsRedux: false,
      needsWeb3: false,
    },
    priorityScore: 0,
    priorityReasons: [],
    ...overrides,
  }
}

/**
 * Creates a component entry with story info attached
 */
function createComponentWithStoryInfo(
  component: Partial<ComponentEntry> = {},
  storyInfo: Partial<StoryInfo> = {},
): ComponentEntry & { storyInfo: StoryInfo } {
  return {
    ...createMockComponent(component),
    storyInfo: {
      path: 'components/common/Test.stories.tsx',
      variants: ['Default'],
      isComplete: false,
      missingStates: [],
      ...storyInfo,
    },
  }
}

describe('coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync.mockReturnValue(false)
    mockFs.readFileSync.mockReturnValue('')
  })

  describe('analyzeStoryCoverage', () => {
    it('should return components unchanged when they have no story', () => {
      const components = [createMockComponent({ name: 'NoStory', hasStory: false })]

      const result = analyzeStoryCoverage(components)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('NoStory')
      expect((result[0] as ComponentEntry & { storyInfo?: StoryInfo }).storyInfo).toBeUndefined()
    })

    it('should analyze story file when component has a story', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(`
        import { Meta } from '@storybook/react'
        const meta = {}
        export default meta
        export const Default = {}
      `)

      // Setup TypeScript mock to return exported variables
      const mockSourceFile = {
        getFullText: () => '',
      }
      mockTs.createSourceFile.mockReturnValue(mockSourceFile)
      mockTs.forEachChild.mockImplementation((_, callback) => {
        // Simulate finding no nodes for simplicity
      })

      const components = [
        createMockComponent({
          name: 'WithStory',
          hasStory: true,
          storyPath: '/path/to/Test.stories.tsx',
        }),
      ]

      const result = analyzeStoryCoverage(components)

      expect(result).toHaveLength(1)
      // The result should have storyInfo attached
      expect((result[0] as ComponentEntry & { storyInfo?: StoryInfo }).storyInfo).toBeDefined()
    })

    it('should handle missing story file gracefully', () => {
      mockFs.existsSync.mockReturnValue(false)

      const components = [
        createMockComponent({
          name: 'WithStory',
          hasStory: true,
          storyPath: '/path/to/nonexistent.stories.tsx',
        }),
      ]

      const result = analyzeStoryCoverage(components)

      expect(result).toHaveLength(1)
      const storyInfo = (result[0] as ComponentEntry & { storyInfo?: StoryInfo }).storyInfo
      expect(storyInfo?.variants).toEqual([])
      expect(storyInfo?.isComplete).toBe(false)
    })

    it('should preserve all original component properties', () => {
      mockFs.existsSync.mockReturnValue(false)

      const original = createMockComponent({
        path: 'special/Component.tsx',
        name: 'Special',
        category: 'sidebar',
        hasStory: true,
        storyPath: '/path/to/Special.stories.tsx',
        priorityScore: 15,
        priorityReasons: ['Important'],
      })

      const result = analyzeStoryCoverage([original])

      expect(result[0].path).toBe(original.path)
      expect(result[0].name).toBe(original.name)
      expect(result[0].category).toBe(original.category)
      expect(result[0].priorityScore).toBe(original.priorityScore)
      expect(result[0].priorityReasons).toEqual(original.priorityReasons)
    })
  })

  describe('calculateCoverageStats', () => {
    it('should count total components', () => {
      const components = [
        createMockComponent({ name: 'A' }),
        createMockComponent({ name: 'B' }),
        createMockComponent({ name: 'C' }),
      ]

      const stats = calculateCoverageStats(components)

      expect(stats.total).toBe(3)
    })

    it('should count components with stories', () => {
      const components = [
        createMockComponent({ name: 'WithStory1', hasStory: true }),
        createMockComponent({ name: 'WithStory2', hasStory: true }),
        createMockComponent({ name: 'NoStory', hasStory: false }),
      ]

      const stats = calculateCoverageStats(components)

      expect(stats.withStories).toBe(2)
    })

    it('should calculate coverage percentage correctly', () => {
      const components = [
        createMockComponent({ hasStory: true }),
        createMockComponent({ hasStory: true }),
        createMockComponent({ hasStory: false }),
        createMockComponent({ hasStory: false }),
      ]

      const stats = calculateCoverageStats(components)

      expect(stats.percentage).toBe(50)
    })

    it('should round percentage to nearest integer', () => {
      const components = [
        createMockComponent({ hasStory: true }),
        createMockComponent({ hasStory: false }),
        createMockComponent({ hasStory: false }),
      ]

      const stats = calculateCoverageStats(components)

      expect(stats.percentage).toBe(33) // 33.33... rounds to 33
    })

    it('should count complete vs incomplete stories', () => {
      const components = [
        createComponentWithStoryInfo({ hasStory: true }, { isComplete: true }),
        createComponentWithStoryInfo({ hasStory: true }, { isComplete: false }),
        createMockComponent({ hasStory: true }), // No storyInfo yet
        createMockComponent({ hasStory: false }),
      ]

      const stats = calculateCoverageStats(components)

      expect(stats.complete).toBe(1)
      expect(stats.incomplete).toBe(2) // One with isComplete: false, one without storyInfo
    })

    it('should return 0% for empty input', () => {
      const stats = calculateCoverageStats([])

      expect(stats.total).toBe(0)
      expect(stats.withStories).toBe(0)
      expect(stats.percentage).toBe(0)
    })

    it('should return 100% when all components have stories', () => {
      const components = [createMockComponent({ hasStory: true }), createMockComponent({ hasStory: true })]

      const stats = calculateCoverageStats(components)

      expect(stats.percentage).toBe(100)
    })
  })

  describe('getCoverageByCategory', () => {
    it('should group components by category', () => {
      const components = [
        createMockComponent({ category: 'ui', hasStory: true }),
        createMockComponent({ category: 'ui', hasStory: false }),
        createMockComponent({ category: 'common', hasStory: true }),
      ]

      const categoryStats = getCoverageByCategory(components)

      const uiStats = categoryStats.find((s) => s.category === 'ui')
      const commonStats = categoryStats.find((s) => s.category === 'common')

      expect(uiStats?.total).toBe(2)
      expect(uiStats?.withStories).toBe(1)
      expect(commonStats?.total).toBe(1)
      expect(commonStats?.withStories).toBe(1)
    })

    it('should calculate percentage per category', () => {
      const components = [
        createMockComponent({ category: 'ui', hasStory: true }),
        createMockComponent({ category: 'ui', hasStory: true }),
        createMockComponent({ category: 'ui', hasStory: false }),
        createMockComponent({ category: 'ui', hasStory: false }),
      ]

      const categoryStats = getCoverageByCategory(components)
      const uiStats = categoryStats.find((s) => s.category === 'ui')

      expect(uiStats?.percentage).toBe(50)
    })

    it('should sort results by total components descending', () => {
      const components = [
        createMockComponent({ category: 'sidebar' }),
        createMockComponent({ category: 'ui' }),
        createMockComponent({ category: 'ui' }),
        createMockComponent({ category: 'ui' }),
        createMockComponent({ category: 'common' }),
        createMockComponent({ category: 'common' }),
      ]

      const categoryStats = getCoverageByCategory(components)

      expect(categoryStats[0].category).toBe('ui')
      expect(categoryStats[1].category).toBe('common')
      expect(categoryStats[2].category).toBe('sidebar')
    })

    it('should return empty array for empty input', () => {
      const categoryStats = getCoverageByCategory([])

      expect(categoryStats).toHaveLength(0)
    })
  })

  describe('getUncoveredComponents', () => {
    it('should return only components without stories', () => {
      const components = [
        createMockComponent({ name: 'WithStory', hasStory: true }),
        createMockComponent({ name: 'NoStory1', hasStory: false }),
        createMockComponent({ name: 'NoStory2', hasStory: false }),
      ]

      const uncovered = getUncoveredComponents(components)

      expect(uncovered).toHaveLength(2)
      expect(uncovered.every((c) => !c.hasStory)).toBe(true)
    })

    it('should sort by priority score descending', () => {
      const components = [
        createMockComponent({ name: 'LowPriority', hasStory: false, priorityScore: 5 }),
        createMockComponent({ name: 'HighPriority', hasStory: false, priorityScore: 15 }),
        createMockComponent({ name: 'MidPriority', hasStory: false, priorityScore: 10 }),
      ]

      const uncovered = getUncoveredComponents(components)

      expect(uncovered.map((c) => c.name)).toEqual(['HighPriority', 'MidPriority', 'LowPriority'])
    })

    it('should return empty array when all components have stories', () => {
      const components = [createMockComponent({ hasStory: true }), createMockComponent({ hasStory: true })]

      const uncovered = getUncoveredComponents(components)

      expect(uncovered).toHaveLength(0)
    })
  })

  describe('getIncompleteComponents', () => {
    it('should return only components with incomplete stories', () => {
      const components = [
        createMockComponent({ name: 'NoStory', hasStory: false }),
        createComponentWithStoryInfo({ name: 'Complete', hasStory: true }, { isComplete: true }),
        createComponentWithStoryInfo({ name: 'Incomplete', hasStory: true }, { isComplete: false }),
      ]

      const incomplete = getIncompleteComponents(components)

      expect(incomplete).toHaveLength(1)
      expect(incomplete[0].name).toBe('Incomplete')
    })

    it('should exclude components without stories', () => {
      const components = [createMockComponent({ name: 'NoStory', hasStory: false })]

      const incomplete = getIncompleteComponents(components)

      expect(incomplete).toHaveLength(0)
    })

    it('should exclude components with complete stories', () => {
      const components = [createComponentWithStoryInfo({ name: 'Complete', hasStory: true }, { isComplete: true })]

      const incomplete = getIncompleteComponents(components)

      expect(incomplete).toHaveLength(0)
    })

    it('should return empty array when all stories are complete', () => {
      const components = [
        createComponentWithStoryInfo({ hasStory: true }, { isComplete: true }),
        createComponentWithStoryInfo({ hasStory: true }, { isComplete: true }),
      ]

      const incomplete = getIncompleteComponents(components)

      expect(incomplete).toHaveLength(0)
    })

    it('should handle components with hasStory but no storyInfo gracefully', () => {
      // This can happen if analyzeStoryCoverage hasn't been called yet
      const components = [createMockComponent({ name: 'WithStory', hasStory: true })]

      const incomplete = getIncompleteComponents(components)

      // Components with hasStory but no storyInfo should not be in incomplete
      // (they haven't been analyzed yet)
      expect(incomplete).toHaveLength(0)
    })
  })
})
