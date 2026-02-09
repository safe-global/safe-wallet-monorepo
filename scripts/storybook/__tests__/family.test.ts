import type { ComponentEntry, ComponentFamily, TopLevelGroup } from '../types'
import {
  groupComponentsIntoFamilies,
  calculateFamilyCoverage,
  getFamilyCoverageByCategory,
  getUncoveredFamilies,
  getPartialFamilies,
  groupFamiliesIntoTopLevel,
  calculateTopLevelCoverage,
} from '../family'

// Mock fs and typescript modules
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}))

jest.mock('typescript', () => ({
  createSourceFile: jest.fn(() => ({
    forEachChild: jest.fn(),
  })),
  forEachChild: jest.fn(),
  ScriptTarget: { Latest: 99 },
  isVariableStatement: jest.fn(() => false),
  getModifiers: jest.fn(() => []),
}))

const mockFs = jest.mocked(require('fs'))

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
 * Creates a mock component family for testing
 */
function createMockFamily(overrides: Partial<ComponentFamily> = {}): ComponentFamily {
  return {
    name: 'TestFamily',
    path: 'components/common/TestFamily',
    components: ['TestComponent'],
    componentEntries: [createMockComponent()],
    storyExports: 0,
    storyExportNames: [],
    coverage: 'none',
    category: 'common',
    ...overrides,
  }
}

/**
 * Creates a mock top-level group for testing
 */
function createMockTopLevelGroup(overrides: Partial<TopLevelGroup> = {}): TopLevelGroup {
  return {
    name: 'Common',
    rootPath: 'components/common',
    category: 'common',
    families: [createMockFamily()],
    totalComponents: 1,
    hasStory: false,
    storyExports: 0,
    coverage: 'none',
    ...overrides,
  }
}

describe('family', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFs.existsSync.mockReturnValue(false)
  })

  describe('groupComponentsIntoFamilies', () => {
    it('should group components in the same directory into one family', () => {
      const components = [
        createMockComponent({ path: 'components/sidebar/Header/Logo.tsx', name: 'Logo' }),
        createMockComponent({ path: 'components/sidebar/Header/Title.tsx', name: 'Title' }),
      ]

      const families = groupComponentsIntoFamilies(components)

      expect(families).toHaveLength(1)
      expect(families[0].components).toContain('Logo')
      expect(families[0].components).toContain('Title')
    })

    it('should create separate families for components in different directories', () => {
      const components = [
        createMockComponent({ path: 'components/sidebar/Header/Logo.tsx', name: 'Logo' }),
        createMockComponent({ path: 'components/sidebar/Footer/Links.tsx', name: 'Links' }),
      ]

      const families = groupComponentsIntoFamilies(components)

      expect(families).toHaveLength(2)
    })

    it('should treat components directly in category folders as individual families', () => {
      // Components directly in category folders (common, ui, etc.) should be their own family
      const components = [
        createMockComponent({ path: 'components/common/Button.tsx', name: 'Button' }),
        createMockComponent({ path: 'components/common/Card.tsx', name: 'Card' }),
      ]

      const families = groupComponentsIntoFamilies(components)

      // Each should be its own family since they're directly in a category folder
      expect(families).toHaveLength(2)
    })

    it('should sort families alphabetically by name', () => {
      const components = [
        createMockComponent({ path: 'components/zebra/Component.tsx', name: 'Zebra' }),
        createMockComponent({ path: 'components/apple/Component.tsx', name: 'Apple' }),
        createMockComponent({ path: 'components/mango/Component.tsx', name: 'Mango' }),
      ]

      const families = groupComponentsIntoFamilies(components)

      expect(families.map((f) => f.name)).toEqual(['Apple', 'Mango', 'Zebra'])
    })

    it('should preserve component category in family', () => {
      const components = [createMockComponent({ path: 'components/sidebar/Header/Logo.tsx', category: 'sidebar' })]

      const families = groupComponentsIntoFamilies(components)

      expect(families[0].category).toBe('sidebar')
    })

    it('should return empty array for empty input', () => {
      const families = groupComponentsIntoFamilies([])

      expect(families).toHaveLength(0)
    })
  })

  describe('calculateFamilyCoverage', () => {
    it('should calculate total families correctly', () => {
      const families = [
        createMockFamily({ name: 'A' }),
        createMockFamily({ name: 'B' }),
        createMockFamily({ name: 'C' }),
      ]

      const stats = calculateFamilyCoverage(families)

      expect(stats.totalFamilies).toBe(3)
    })

    it('should count covered families (partial or complete)', () => {
      const families = [
        createMockFamily({ name: 'Complete', coverage: 'complete' }),
        createMockFamily({ name: 'Partial', coverage: 'partial' }),
        createMockFamily({ name: 'None', coverage: 'none' }),
      ]

      const stats = calculateFamilyCoverage(families)

      expect(stats.coveredFamilies).toBe(2)
    })

    it('should count only complete families separately', () => {
      const families = [
        createMockFamily({ name: 'Complete', coverage: 'complete' }),
        createMockFamily({ name: 'Partial', coverage: 'partial' }),
      ]

      const stats = calculateFamilyCoverage(families)

      expect(stats.completeFamilies).toBe(1)
    })

    it('should calculate coverage percentage correctly', () => {
      const families = [
        createMockFamily({ coverage: 'complete' }),
        createMockFamily({ coverage: 'partial' }),
        createMockFamily({ coverage: 'none' }),
        createMockFamily({ coverage: 'none' }),
      ]

      const stats = calculateFamilyCoverage(families)

      expect(stats.familyCoveragePercent).toBe(50) // 2 out of 4
    })

    it('should sum story exports across all families', () => {
      const families = [
        createMockFamily({ storyExports: 3 }),
        createMockFamily({ storyExports: 5 }),
        createMockFamily({ storyExports: 2 }),
      ]

      const stats = calculateFamilyCoverage(families)

      expect(stats.totalStoryExports).toBe(10)
    })

    it('should return 0% coverage for empty input', () => {
      const stats = calculateFamilyCoverage([])

      expect(stats.familyCoveragePercent).toBe(0)
      expect(stats.totalFamilies).toBe(0)
    })
  })

  describe('getFamilyCoverageByCategory', () => {
    it('should group families by category', () => {
      const families = [
        createMockFamily({ category: 'ui', coverage: 'complete' }),
        createMockFamily({ category: 'ui', coverage: 'none' }),
        createMockFamily({ category: 'common', coverage: 'partial' }),
      ]

      const categoryStats = getFamilyCoverageByCategory(families)

      const uiStats = categoryStats.find((s) => s.category === 'ui')
      const commonStats = categoryStats.find((s) => s.category === 'common')

      expect(uiStats?.totalFamilies).toBe(2)
      expect(uiStats?.coveredFamilies).toBe(1)
      expect(commonStats?.totalFamilies).toBe(1)
      expect(commonStats?.coveredFamilies).toBe(1)
    })

    it('should calculate percentage per category', () => {
      const families = [
        createMockFamily({ category: 'ui', coverage: 'complete' }),
        createMockFamily({ category: 'ui', coverage: 'complete' }),
        createMockFamily({ category: 'ui', coverage: 'none' }),
        createMockFamily({ category: 'ui', coverage: 'none' }),
      ]

      const categoryStats = getFamilyCoverageByCategory(families)
      const uiStats = categoryStats.find((s) => s.category === 'ui')

      expect(uiStats?.percentage).toBe(50)
    })

    it('should sum story exports per category', () => {
      const families = [
        createMockFamily({ category: 'ui', storyExports: 3 }),
        createMockFamily({ category: 'ui', storyExports: 7 }),
      ]

      const categoryStats = getFamilyCoverageByCategory(families)
      const uiStats = categoryStats.find((s) => s.category === 'ui')

      expect(uiStats?.storyExports).toBe(10)
    })

    it('should sort results by total families descending', () => {
      const families = [
        createMockFamily({ category: 'sidebar' }),
        createMockFamily({ category: 'ui' }),
        createMockFamily({ category: 'ui' }),
        createMockFamily({ category: 'ui' }),
        createMockFamily({ category: 'common' }),
        createMockFamily({ category: 'common' }),
      ]

      const categoryStats = getFamilyCoverageByCategory(families)

      expect(categoryStats[0].category).toBe('ui')
      expect(categoryStats[1].category).toBe('common')
      expect(categoryStats[2].category).toBe('sidebar')
    })
  })

  describe('getUncoveredFamilies', () => {
    it('should return only families with no coverage', () => {
      const families = [
        createMockFamily({ name: 'Complete', coverage: 'complete' }),
        createMockFamily({ name: 'Partial', coverage: 'partial' }),
        createMockFamily({ name: 'None1', coverage: 'none' }),
        createMockFamily({ name: 'None2', coverage: 'none' }),
      ]

      const uncovered = getUncoveredFamilies(families)

      expect(uncovered).toHaveLength(2)
      expect(uncovered.map((f) => f.name)).toEqual(['None1', 'None2'])
    })

    it('should return empty array when all families have coverage', () => {
      const families = [createMockFamily({ coverage: 'complete' }), createMockFamily({ coverage: 'partial' })]

      const uncovered = getUncoveredFamilies(families)

      expect(uncovered).toHaveLength(0)
    })
  })

  describe('getPartialFamilies', () => {
    it('should return only families with partial coverage', () => {
      const families = [
        createMockFamily({ name: 'Complete', coverage: 'complete' }),
        createMockFamily({ name: 'Partial1', coverage: 'partial' }),
        createMockFamily({ name: 'Partial2', coverage: 'partial' }),
        createMockFamily({ name: 'None', coverage: 'none' }),
      ]

      const partial = getPartialFamilies(families)

      expect(partial).toHaveLength(2)
      expect(partial.map((f) => f.name)).toEqual(['Partial1', 'Partial2'])
    })

    it('should return empty array when no families have partial coverage', () => {
      const families = [createMockFamily({ coverage: 'complete' }), createMockFamily({ coverage: 'none' })]

      const partial = getPartialFamilies(families)

      expect(partial).toHaveLength(0)
    })
  })

  describe('groupFamiliesIntoTopLevel', () => {
    it('should group families by top-level directory', () => {
      const families = [
        createMockFamily({ path: 'components/sidebar/Header' }),
        createMockFamily({ path: 'components/sidebar/Footer' }),
        createMockFamily({ path: 'components/common/Utils' }),
      ]

      const groups = groupFamiliesIntoTopLevel(families)

      expect(groups).toHaveLength(2)
      const sidebarGroup = groups.find((g) => g.rootPath === 'components/sidebar')
      expect(sidebarGroup?.families).toHaveLength(2)
    })

    it('should handle features path correctly', () => {
      const families = [
        createMockFamily({ path: 'features/swap/components/SwapButton' }),
        createMockFamily({ path: 'features/swap/components/SwapInput' }),
        createMockFamily({ path: 'features/bridge/components/BridgeForm' }),
      ]

      const groups = groupFamiliesIntoTopLevel(families)

      const swapGroup = groups.find((g) => g.rootPath === 'features/swap')
      const bridgeGroup = groups.find((g) => g.rootPath === 'features/bridge')

      expect(swapGroup?.families).toHaveLength(2)
      expect(bridgeGroup?.families).toHaveLength(1)
    })

    it('should calculate total components across families', () => {
      const families = [
        createMockFamily({
          path: 'components/sidebar/Header',
          components: ['Logo', 'Title'],
        }),
        createMockFamily({
          path: 'components/sidebar/Footer',
          components: ['Links'],
        }),
      ]

      const groups = groupFamiliesIntoTopLevel(families)
      const sidebarGroup = groups.find((g) => g.rootPath === 'components/sidebar')

      expect(sidebarGroup?.totalComponents).toBe(3)
    })

    it('should set complete coverage when all families have stories', () => {
      const families = [
        createMockFamily({ path: 'components/sidebar/A', coverage: 'complete' }),
        createMockFamily({ path: 'components/sidebar/B', coverage: 'complete' }),
      ]

      const groups = groupFamiliesIntoTopLevel(families)
      const sidebarGroup = groups.find((g) => g.rootPath === 'components/sidebar')

      expect(sidebarGroup?.coverage).toBe('complete')
    })

    it('should set partial coverage when some families have stories', () => {
      const families = [
        createMockFamily({ path: 'components/sidebar/A', coverage: 'complete' }),
        createMockFamily({ path: 'components/sidebar/B', coverage: 'none' }),
      ]

      const groups = groupFamiliesIntoTopLevel(families)
      const sidebarGroup = groups.find((g) => g.rootPath === 'components/sidebar')

      expect(sidebarGroup?.coverage).toBe('partial')
    })

    it('should set none coverage when no families have stories', () => {
      const families = [
        createMockFamily({ path: 'components/sidebar/A', coverage: 'none' }),
        createMockFamily({ path: 'components/sidebar/B', coverage: 'none' }),
      ]

      const groups = groupFamiliesIntoTopLevel(families)
      const sidebarGroup = groups.find((g) => g.rootPath === 'components/sidebar')

      expect(sidebarGroup?.coverage).toBe('none')
    })

    it('should sort groups alphabetically by name', () => {
      const families = [
        createMockFamily({ path: 'components/zebra/A' }),
        createMockFamily({ path: 'components/alpha/B' }),
        createMockFamily({ path: 'components/mango/C' }),
      ]

      const groups = groupFamiliesIntoTopLevel(families)

      expect(groups.map((g) => g.name)).toEqual(['Alpha', 'Mango', 'Zebra'])
    })
  })

  describe('calculateTopLevelCoverage', () => {
    it('should count total and covered groups', () => {
      const groups = [
        createMockTopLevelGroup({ coverage: 'complete' }),
        createMockTopLevelGroup({ coverage: 'partial' }),
        createMockTopLevelGroup({ coverage: 'none' }),
      ]

      const report = calculateTopLevelCoverage(groups)

      expect(report.totalGroups).toBe(3)
      expect(report.coveredGroups).toBe(2)
    })

    it('should calculate coverage percentage', () => {
      const groups = [createMockTopLevelGroup({ coverage: 'complete' }), createMockTopLevelGroup({ coverage: 'none' })]

      const report = calculateTopLevelCoverage(groups)

      expect(report.coveragePercent).toBe(50)
    })

    it('should sum story exports', () => {
      const groups = [createMockTopLevelGroup({ storyExports: 5 }), createMockTopLevelGroup({ storyExports: 10 })]

      const report = calculateTopLevelCoverage(groups)

      expect(report.totalStoryExports).toBe(15)
    })

    it('should include category breakdown', () => {
      const groups = [
        createMockTopLevelGroup({ category: 'sidebar', coverage: 'complete' }),
        createMockTopLevelGroup({ category: 'sidebar', coverage: 'none' }),
        createMockTopLevelGroup({ category: 'common', coverage: 'complete' }),
      ]

      const report = calculateTopLevelCoverage(groups)

      const sidebarCategory = report.byCategory.find((c) => c.category === 'sidebar')
      const commonCategory = report.byCategory.find((c) => c.category === 'common')

      expect(sidebarCategory?.total).toBe(2)
      expect(sidebarCategory?.covered).toBe(1)
      expect(sidebarCategory?.percentage).toBe(50)
      expect(commonCategory?.total).toBe(1)
      expect(commonCategory?.covered).toBe(1)
      expect(commonCategory?.percentage).toBe(100)
    })

    it('should sort groups by coverage status (none first, then partial, then complete)', () => {
      const groups = [
        createMockTopLevelGroup({ name: 'Complete', coverage: 'complete' }),
        createMockTopLevelGroup({ name: 'None', coverage: 'none' }),
        createMockTopLevelGroup({ name: 'Partial', coverage: 'partial' }),
      ]

      const report = calculateTopLevelCoverage(groups)

      expect(report.groups.map((g) => g.name)).toEqual(['None', 'Partial', 'Complete'])
    })

    it('should include timestamp', () => {
      const groups = [createMockTopLevelGroup()]

      const report = calculateTopLevelCoverage(groups)

      expect(report.timestamp).toBeDefined()
      expect(new Date(report.timestamp).getTime()).not.toBeNaN()
    })
  })
})
