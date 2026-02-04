import type { ComponentEntry, PriorityWeights } from '../types'
import { calculatePriorityScores, getTopPriorityComponents, groupByPriorityTier, generateWorkOrder } from '../priority'
import { DEFAULT_PRIORITY_WEIGHTS } from '../types'

/**
 * Creates a mock component entry for testing
 */
function createMockComponent(overrides: Partial<ComponentEntry> = {}): ComponentEntry {
  return {
    path: 'components/test/Test.tsx',
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

describe('priority', () => {
  describe('calculatePriorityScores', () => {
    it('should give sidebar components +15 priority', () => {
      const components = [createMockComponent({ category: 'sidebar', name: 'SidebarNav' })]
      const result = calculatePriorityScores(components)

      expect(result[0].priorityScore).toBeGreaterThanOrEqual(15)
      expect(result[0].priorityReasons).toContainEqual(
        expect.stringContaining('Sidebar component - critical for page stories'),
      )
    })

    it('should give UI components +10 priority', () => {
      const components = [createMockComponent({ category: 'ui', name: 'Button' })]
      const result = calculatePriorityScores(components)

      expect(result[0].priorityScore).toBeGreaterThanOrEqual(10)
      expect(result[0].priorityReasons).toContainEqual(expect.stringContaining('UI component'))
    })

    it('should give common components +8 priority', () => {
      const components = [createMockComponent({ category: 'common', name: 'EthHashInfo' })]
      const result = calculatePriorityScores(components)

      expect(result[0].priorityReasons).toContainEqual(expect.stringContaining('Common component'))
    })

    it('should give feature components +5 priority', () => {
      const components = [createMockComponent({ category: 'feature', name: 'SwapWidget' })]
      const result = calculatePriorityScores(components)

      expect(result[0].priorityReasons).toContainEqual(expect.stringContaining('Feature component'))
    })

    it('should add bonus for components with multiple dependents (3+)', () => {
      const components = [
        createMockComponent({ name: 'Button', category: 'ui' }),
        createMockComponent({
          name: 'Card',
          dependencies: { ...createMockComponent().dependencies, components: ['Button'] },
        }),
        createMockComponent({
          name: 'Dialog',
          dependencies: { ...createMockComponent().dependencies, components: ['Button'] },
        }),
        createMockComponent({
          name: 'Form',
          dependencies: { ...createMockComponent().dependencies, components: ['Button'] },
        }),
      ]
      const result = calculatePriorityScores(components)
      const button = result.find((c) => c.name === 'Button')!

      expect(button.priorityReasons).toContainEqual(expect.stringContaining('dependents'))
    })

    it('should add higher bonus for components with 5+ dependents', () => {
      const components = [
        createMockComponent({ name: 'Button', category: 'ui' }),
        ...['Card', 'Dialog', 'Form', 'Panel', 'Header'].map((name) =>
          createMockComponent({
            name,
            dependencies: { ...createMockComponent().dependencies, components: ['Button'] },
          }),
        ),
      ]
      const result = calculatePriorityScores(components)
      const button = result.find((c) => c.name === 'Button')!

      // Should have the doubled bonus for high dependents (5+)
      expect(button.priorityReasons).toContainEqual(expect.stringContaining('High dependents'))
    })

    it('should add bonus for MSW-dependent components without Web3', () => {
      const components = [
        createMockComponent({
          name: 'DataFetcher',
          dependencies: { ...createMockComponent().dependencies, needsMsw: true, needsWeb3: false },
        }),
      ]
      const result = calculatePriorityScores(components)

      expect(result[0].priorityReasons).toContainEqual(expect.stringContaining('Needs MSW'))
    })

    it('should add quick win bonus for components without complex dependencies', () => {
      const components = [
        createMockComponent({
          name: 'SimpleComponent',
          dependencies: {
            ...createMockComponent().dependencies,
            needsRedux: false,
            needsWeb3: false,
            needsMsw: false,
          },
        }),
      ]
      const result = calculatePriorityScores(components)

      expect(result[0].priorityReasons).toContainEqual(expect.stringContaining('quick win'))
    })

    it('should penalize Web3-dependent components', () => {
      const components = [
        createMockComponent({
          name: 'WalletConnect',
          dependencies: { ...createMockComponent().dependencies, needsWeb3: true },
        }),
      ]
      const result = calculatePriorityScores(components)

      expect(result[0].priorityReasons).toContainEqual(expect.stringContaining('Needs Web3 mocking'))
    })

    it('should use custom weights when provided', () => {
      const customWeights: PriorityWeights = {
        uiComponent: 100,
        sidebarComponent: 50,
        commonComponent: 25,
        highDependents: 10,
        needsMsw: 5,
        featureComponent: 3,
      }
      const components = [createMockComponent({ category: 'ui', name: 'Button' })]
      const result = calculatePriorityScores(components, customWeights)

      expect(result[0].priorityReasons).toContainEqual(expect.stringContaining('(+100)'))
    })

    it('should preserve all original component properties', () => {
      const original = createMockComponent({
        path: 'special/path/Component.tsx',
        name: 'SpecialComponent',
        category: 'sidebar',
        hasStory: true,
        storyPath: 'special/path/Component.stories.tsx',
      })
      const result = calculatePriorityScores([original])

      expect(result[0].path).toBe(original.path)
      expect(result[0].name).toBe(original.name)
      expect(result[0].category).toBe(original.category)
      expect(result[0].hasStory).toBe(original.hasStory)
      expect(result[0].storyPath).toBe(original.storyPath)
    })
  })

  describe('getTopPriorityComponents', () => {
    it('should return only uncovered components sorted by priority', () => {
      const components = [
        createMockComponent({ name: 'LowPriority', priorityScore: 5, hasStory: false }),
        createMockComponent({ name: 'HighPriority', priorityScore: 15, hasStory: false }),
        createMockComponent({ name: 'Covered', priorityScore: 20, hasStory: true }),
      ]
      const result = getTopPriorityComponents(components)

      expect(result).toHaveLength(2)
      expect(result.map((c) => c.name)).toEqual(['HighPriority', 'LowPriority'])
    })

    it('should respect the limit parameter', () => {
      const components = Array.from({ length: 10 }, (_, i) =>
        createMockComponent({ name: `Component${i}`, priorityScore: i, hasStory: false }),
      )
      const result = getTopPriorityComponents(components, 3)

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Component9')
    })

    it('should return all uncovered components when limit exceeds count', () => {
      const components = [
        createMockComponent({ name: 'A', priorityScore: 10, hasStory: false }),
        createMockComponent({ name: 'B', priorityScore: 5, hasStory: false }),
      ]
      const result = getTopPriorityComponents(components, 100)

      expect(result).toHaveLength(2)
    })

    it('should return empty array when all components have stories', () => {
      const components = [
        createMockComponent({ name: 'A', priorityScore: 10, hasStory: true }),
        createMockComponent({ name: 'B', priorityScore: 5, hasStory: true }),
      ]
      const result = getTopPriorityComponents(components)

      expect(result).toHaveLength(0)
    })
  })

  describe('groupByPriorityTier', () => {
    it('should group components into correct tiers', () => {
      const components = [
        createMockComponent({ name: 'Critical', priorityScore: 25 }),
        createMockComponent({ name: 'High', priorityScore: 17 }),
        createMockComponent({ name: 'Medium', priorityScore: 12 }),
        createMockComponent({ name: 'Low', priorityScore: 5 }),
      ]
      const tiers = groupByPriorityTier(components)

      expect(tiers.get('critical')!.map((c) => c.name)).toContain('Critical')
      expect(tiers.get('high')!.map((c) => c.name)).toContain('High')
      expect(tiers.get('medium')!.map((c) => c.name)).toContain('Medium')
      expect(tiers.get('low')!.map((c) => c.name)).toContain('Low')
    })

    it('should correctly apply tier thresholds (>=20 critical, >=15 high, >=10 medium, else low)', () => {
      const components = [
        createMockComponent({ name: 'Score20', priorityScore: 20 }),
        createMockComponent({ name: 'Score19', priorityScore: 19 }),
        createMockComponent({ name: 'Score15', priorityScore: 15 }),
        createMockComponent({ name: 'Score14', priorityScore: 14 }),
        createMockComponent({ name: 'Score10', priorityScore: 10 }),
        createMockComponent({ name: 'Score9', priorityScore: 9 }),
      ]
      const tiers = groupByPriorityTier(components)

      expect(tiers.get('critical')!.map((c) => c.name)).toEqual(['Score20'])
      expect(tiers.get('high')!.map((c) => c.name)).toEqual(['Score19', 'Score15'])
      expect(tiers.get('medium')!.map((c) => c.name)).toEqual(['Score14', 'Score10'])
      expect(tiers.get('low')!.map((c) => c.name)).toEqual(['Score9'])
    })

    it('should return empty arrays for tiers with no components', () => {
      const components = [createMockComponent({ name: 'Critical', priorityScore: 25 })]
      const tiers = groupByPriorityTier(components)

      expect(tiers.get('critical')!).toHaveLength(1)
      expect(tiers.get('high')!).toHaveLength(0)
      expect(tiers.get('medium')!).toHaveLength(0)
      expect(tiers.get('low')!).toHaveLength(0)
    })

    it('should handle empty input array', () => {
      const tiers = groupByPriorityTier([])

      expect(tiers.get('critical')!).toHaveLength(0)
      expect(tiers.get('high')!).toHaveLength(0)
      expect(tiers.get('medium')!).toHaveLength(0)
      expect(tiers.get('low')!).toHaveLength(0)
    })
  })

  describe('generateWorkOrder', () => {
    it('should only include uncovered components', () => {
      const components = [
        createMockComponent({ name: 'Covered', category: 'ui', hasStory: true }),
        createMockComponent({ name: 'Uncovered', category: 'ui', hasStory: false }),
      ]
      const workOrder = generateWorkOrder(components)

      const allComponents = workOrder.flatMap((phase) => phase.components)
      expect(allComponents.some((c) => c.name === 'Covered')).toBe(false)
      expect(allComponents.some((c) => c.name === 'Uncovered')).toBe(true)
    })

    it('should put UI components in Phase 1', () => {
      const components = [createMockComponent({ name: 'Button', category: 'ui', hasStory: false })]
      const workOrder = generateWorkOrder(components)

      expect(workOrder[0].phase).toContain('Phase 1')
      expect(workOrder[0].phase).toContain('shadcn/ui')
      expect(workOrder[0].components.map((c) => c.name)).toContain('Button')
      expect(workOrder[0].estimatedEffort).toBe('low')
    })

    it('should put sidebar components in Phase 2', () => {
      const components = [createMockComponent({ name: 'SidebarNav', category: 'sidebar', hasStory: false })]
      const workOrder = generateWorkOrder(components)

      const phase2 = workOrder.find((p) => p.phase.includes('Phase 2'))
      expect(phase2).toBeDefined()
      expect(phase2!.components.map((c) => c.name)).toContain('SidebarNav')
      expect(phase2!.estimatedEffort).toBe('medium')
    })

    it('should put simple common components (no complex deps) in Phase 3', () => {
      const components = [
        createMockComponent({
          name: 'SimpleCommon',
          category: 'common',
          hasStory: false,
          dependencies: {
            ...createMockComponent().dependencies,
            needsWeb3: false,
            needsRedux: false,
            needsMsw: false,
          },
        }),
      ]
      const workOrder = generateWorkOrder(components)

      const phase3 = workOrder.find((p) => p.phase.includes('Phase 3'))
      expect(phase3).toBeDefined()
      expect(phase3!.components.map((c) => c.name)).toContain('SimpleCommon')
    })

    it('should put Redux-only components in Phase 4', () => {
      const components = [
        createMockComponent({
          name: 'ReduxComponent',
          category: 'common',
          hasStory: false,
          dependencies: {
            ...createMockComponent().dependencies,
            needsRedux: true,
            needsWeb3: false,
            needsMsw: false,
          },
        }),
      ]
      const workOrder = generateWorkOrder(components)

      const phase4 = workOrder.find((p) => p.phase.includes('Phase 4'))
      expect(phase4).toBeDefined()
      expect(phase4!.components.map((c) => c.name)).toContain('ReduxComponent')
    })

    it('should put MSW components (without Web3) in Phase 5', () => {
      const components = [
        createMockComponent({
          name: 'ApiComponent',
          category: 'common',
          hasStory: false,
          dependencies: {
            ...createMockComponent().dependencies,
            needsMsw: true,
            needsWeb3: false,
          },
        }),
      ]
      const workOrder = generateWorkOrder(components)

      const phase5 = workOrder.find((p) => p.phase.includes('Phase 5'))
      expect(phase5).toBeDefined()
      expect(phase5!.components.map((c) => c.name)).toContain('ApiComponent')
    })

    it('should put Web3 components in Phase 6', () => {
      const components = [
        createMockComponent({
          name: 'WalletComponent',
          category: 'common',
          hasStory: false,
          dependencies: {
            ...createMockComponent().dependencies,
            needsWeb3: true,
          },
        }),
      ]
      const workOrder = generateWorkOrder(components)

      const phase6 = workOrder.find((p) => p.phase.includes('Phase 6'))
      expect(phase6).toBeDefined()
      expect(phase6!.components.map((c) => c.name)).toContain('WalletComponent')
      expect(phase6!.estimatedEffort).toBe('high')
    })

    it('should put components with Redux AND MSW in Phase 6 (complex)', () => {
      const components = [
        createMockComponent({
          name: 'ComplexComponent',
          category: 'common',
          hasStory: false,
          dependencies: {
            ...createMockComponent().dependencies,
            needsRedux: true,
            needsMsw: true,
            needsWeb3: false,
          },
        }),
      ]
      const workOrder = generateWorkOrder(components)

      const phase6 = workOrder.find((p) => p.phase.includes('Phase 6'))
      expect(phase6).toBeDefined()
      expect(phase6!.components.map((c) => c.name)).toContain('ComplexComponent')
    })

    it('should return empty array when all components have stories', () => {
      const components = [
        createMockComponent({ name: 'A', hasStory: true }),
        createMockComponent({ name: 'B', hasStory: true }),
      ]
      const workOrder = generateWorkOrder(components)

      expect(workOrder).toHaveLength(0)
    })

    it('should sort components within phases by priority score', () => {
      const components = [
        createMockComponent({ name: 'LowButton', category: 'ui', hasStory: false, priorityScore: 5 }),
        createMockComponent({ name: 'HighButton', category: 'ui', hasStory: false, priorityScore: 15 }),
        createMockComponent({ name: 'MidButton', category: 'ui', hasStory: false, priorityScore: 10 }),
      ]
      const workOrder = generateWorkOrder(components)
      const phase1Components = workOrder[0].components

      expect(phase1Components[0].name).toBe('HighButton')
      expect(phase1Components[1].name).toBe('MidButton')
      expect(phase1Components[2].name).toBe('LowButton')
    })
  })
})
