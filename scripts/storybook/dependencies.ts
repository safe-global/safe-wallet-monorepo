import type { ComponentEntry } from './types'

/**
 * Builds a dependency graph for components
 */
export function buildDependencyGraph(components: ComponentEntry[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()
  const componentNames = new Set(components.map((c) => c.name))

  for (const component of components) {
    const deps = new Set<string>()

    // Add component dependencies that are in our component list
    for (const dep of component.dependencies.components) {
      if (componentNames.has(dep)) {
        deps.add(dep)
      }
    }

    graph.set(component.name, deps)
  }

  return graph
}

/**
 * Calculates how many other components depend on each component
 */
export function calculateDependentCounts(components: ComponentEntry[]): Map<string, number> {
  const graph = buildDependencyGraph(components)
  const dependentCounts = new Map<string, number>()

  // Initialize all components with 0 dependents
  for (const component of components) {
    dependentCounts.set(component.name, 0)
  }

  // Count how many components depend on each component
  for (const [, deps] of graph) {
    for (const dep of deps) {
      const current = dependentCounts.get(dep) || 0
      dependentCounts.set(dep, current + 1)
    }
  }

  return dependentCounts
}

/**
 * Finds components that are critical dependencies (used by many others)
 */
export function findCriticalDependencies(components: ComponentEntry[], threshold = 3): ComponentEntry[] {
  const dependentCounts = calculateDependentCounts(components)

  return components
    .filter((c) => (dependentCounts.get(c.name) || 0) >= threshold)
    .sort((a, b) => (dependentCounts.get(b.name) || 0) - (dependentCounts.get(a.name) || 0))
}

/**
 * Analyzes which external APIs/hooks a component uses
 */
export function analyzeExternalDependencies(component: ComponentEntry): {
  requiresMocking: string[]
  mockingComplexity: 'low' | 'medium' | 'high'
} {
  const requiresMocking: string[] = []
  let complexity: 'low' | 'medium' | 'high' = 'low'

  // Check for hooks that need mocking
  for (const hook of component.dependencies.hooks) {
    // Hooks that typically need MSW or Redux mocking
    if (
      hook.includes('Safe') ||
      hook.includes('Transaction') ||
      hook.includes('Balance') ||
      hook.includes('Chain') ||
      hook.includes('Wallet') ||
      hook.includes('Web3')
    ) {
      requiresMocking.push(hook)
    }
  }

  // Check for Redux dependencies
  if (component.dependencies.needsRedux) {
    requiresMocking.push('Redux state')
    complexity = 'medium'
  }

  // Check for Web3 dependencies
  if (component.dependencies.needsWeb3) {
    requiresMocking.push('Web3 provider')
    complexity = 'high'
  }

  // Check for API calls
  if (component.dependencies.needsMsw) {
    requiresMocking.push('API endpoints')
    if (complexity !== 'high') {
      complexity = 'medium'
    }
  }

  // Multiple mocking requirements increases complexity
  if (requiresMocking.length > 3) {
    complexity = 'high'
  }

  return {
    requiresMocking,
    mockingComplexity: complexity,
  }
}

/**
 * Groups components by their mocking requirements
 */
export function groupByMockingRequirements(
  components: ComponentEntry[],
): Map<'none' | 'redux' | 'msw' | 'web3' | 'complex', ComponentEntry[]> {
  const groups = new Map<'none' | 'redux' | 'msw' | 'web3' | 'complex', ComponentEntry[]>([
    ['none', []],
    ['redux', []],
    ['msw', []],
    ['web3', []],
    ['complex', []],
  ])

  for (const component of components) {
    const { dependencies } = component
    const needsCount = [dependencies.needsRedux, dependencies.needsMsw, dependencies.needsWeb3].filter(Boolean).length

    if (needsCount >= 2) {
      groups.get('complex')!.push(component)
    } else if (dependencies.needsWeb3) {
      groups.get('web3')!.push(component)
    } else if (dependencies.needsMsw) {
      groups.get('msw')!.push(component)
    } else if (dependencies.needsRedux) {
      groups.get('redux')!.push(component)
    } else {
      groups.get('none')!.push(component)
    }
  }

  return groups
}

/**
 * Suggests the order to create stories based on dependencies
 */
export function suggestStoryCreationOrder(components: ComponentEntry[]): ComponentEntry[] {
  const dependentCounts = calculateDependentCounts(components)
  const uncovered = components.filter((c) => !c.hasStory)

  return uncovered.sort((a, b) => {
    // First, sort by mocking complexity (simpler first)
    const aAnalysis = analyzeExternalDependencies(a)
    const bAnalysis = analyzeExternalDependencies(b)
    const complexityOrder = { low: 0, medium: 1, high: 2 }

    const complexityDiff = complexityOrder[aAnalysis.mockingComplexity] - complexityOrder[bAnalysis.mockingComplexity]
    if (complexityDiff !== 0) return complexityDiff

    // Then by number of dependents (more dependents = higher priority)
    const dependentsDiff = (dependentCounts.get(b.name) || 0) - (dependentCounts.get(a.name) || 0)
    if (dependentsDiff !== 0) return dependentsDiff

    // Finally by priority score
    return b.priorityScore - a.priorityScore
  })
}
