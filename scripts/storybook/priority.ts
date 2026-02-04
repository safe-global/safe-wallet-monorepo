/**
 * Priority Scoring
 *
 * Calculates priority scores for components to guide story creation order.
 * Higher scores indicate components that should be prioritized for stories.
 *
 * Scoring factors:
 * - Sidebar components: +15 (critical for page stories)
 * - UI primitives: +10 (high reuse)
 * - Common components: +8 (shared across features)
 * - High dependents: +5 per dependent
 *
 * Key function: calculatePriorityScores(components) → components with priorityScore
 *
 * Used by: generate-storybook-coverage.ts
 */

import type { ComponentEntry, PriorityWeights } from './types'
import { DEFAULT_PRIORITY_WEIGHTS } from './types'

/**
 * Builds a dependency graph for components
 */
function buildDependencyGraph(components: ComponentEntry[]): Map<string, Set<string>> {
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
function calculateDependentCounts(components: ComponentEntry[]): Map<string, number> {
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
 * Calculates priority scores for all components
 */
export function calculatePriorityScores(
  components: ComponentEntry[],
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS,
): ComponentEntry[] {
  const dependentCounts = calculateDependentCounts(components)

  return components.map((component) => {
    const { score, reasons } = calculateComponentPriority(component, dependentCounts, weights)
    return {
      ...component,
      priorityScore: score,
      priorityReasons: reasons,
    }
  })
}

/**
 * Calculates priority for a single component
 */
function calculateComponentPriority(
  component: ComponentEntry,
  dependentCounts: Map<string, number>,
  weights: PriorityWeights,
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Category-based scoring
  switch (component.category) {
    case 'ui':
      score += weights.uiComponent
      reasons.push(`UI component (+${weights.uiComponent})`)
      break
    case 'sidebar':
      score += weights.sidebarComponent
      reasons.push(`Sidebar component - critical for page stories (+${weights.sidebarComponent})`)
      break
    case 'common':
      score += weights.commonComponent
      reasons.push(`Common component - high reuse (+${weights.commonComponent})`)
      break
    case 'feature':
      score += weights.featureComponent
      reasons.push(`Feature component (+${weights.featureComponent})`)
      break
  }

  // Dependents scoring
  const dependents = dependentCounts.get(component.name) || 0
  if (dependents >= 5) {
    score += weights.highDependents * 2
    reasons.push(`High dependents (${dependents}) (+${weights.highDependents * 2})`)
  } else if (dependents >= 3) {
    score += weights.highDependents
    reasons.push(`Multiple dependents (${dependents}) (+${weights.highDependents})`)
  }

  // MSW requirement scoring (easier to mock = higher priority for quick wins)
  if (component.dependencies.needsMsw && !component.dependencies.needsWeb3) {
    score += weights.needsMsw
    reasons.push(`Needs MSW (API mocking) (+${weights.needsMsw})`)
  }

  // Bonus for components without complex dependencies (quick wins)
  if (!component.dependencies.needsRedux && !component.dependencies.needsWeb3 && !component.dependencies.needsMsw) {
    score += 5
    reasons.push('No complex dependencies - quick win (+5)')
  }

  // Penalty for complex mocking requirements
  if (component.dependencies.needsWeb3) {
    score -= 3
    reasons.push('Needs Web3 mocking (-3)')
  }

  return { score, reasons }
}

/**
 * Gets top priority components for story creation
 */
export function getTopPriorityComponents(components: ComponentEntry[], limit = 20): ComponentEntry[] {
  return components
    .filter((c) => !c.hasStory)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit)
}

/**
 * Groups components by priority tier
 */
export function groupByPriorityTier(
  components: ComponentEntry[],
): Map<'critical' | 'high' | 'medium' | 'low', ComponentEntry[]> {
  const tiers = new Map<'critical' | 'high' | 'medium' | 'low', ComponentEntry[]>([
    ['critical', []],
    ['high', []],
    ['medium', []],
    ['low', []],
  ])

  for (const component of components) {
    if (component.priorityScore >= 20) {
      tiers.get('critical')!.push(component)
    } else if (component.priorityScore >= 15) {
      tiers.get('high')!.push(component)
    } else if (component.priorityScore >= 10) {
      tiers.get('medium')!.push(component)
    } else {
      tiers.get('low')!.push(component)
    }
  }

  return tiers
}

/**
 * Generates a prioritized work order for story creation
 */
export function generateWorkOrder(components: ComponentEntry[]): {
  phase: string
  components: ComponentEntry[]
  estimatedEffort: 'low' | 'medium' | 'high'
  rationale: string
}[] {
  const uncovered = components.filter((c) => !c.hasStory)
  const workOrder: {
    phase: string
    components: ComponentEntry[]
    estimatedEffort: 'low' | 'medium' | 'high'
    rationale: string
  }[] = []

  // Phase 1: shadcn/ui components (quick wins, no mocking needed)
  const uiComponents = uncovered.filter((c) => c.category === 'ui').sort((a, b) => b.priorityScore - a.priorityScore)

  if (uiComponents.length > 0) {
    workOrder.push({
      phase: 'Phase 1: shadcn/ui Components',
      components: uiComponents,
      estimatedEffort: 'low',
      rationale: 'UI primitives with no external dependencies - fastest to create',
    })
  }

  // Phase 2: Sidebar components (critical for page stories)
  const sidebarComponents = uncovered
    .filter((c) => c.category === 'sidebar')
    .sort((a, b) => b.priorityScore - a.priorityScore)

  if (sidebarComponents.length > 0) {
    workOrder.push({
      phase: 'Phase 2: Sidebar Components',
      components: sidebarComponents,
      estimatedEffort: 'medium',
      rationale: 'Required for page-level stories with full layout',
    })
  }

  // Phase 3: Common components without complex dependencies
  const simpleCommon = uncovered
    .filter(
      (c) =>
        c.category === 'common' && !c.dependencies.needsWeb3 && !c.dependencies.needsRedux && !c.dependencies.needsMsw,
    )
    .sort((a, b) => b.priorityScore - a.priorityScore)

  if (simpleCommon.length > 0) {
    workOrder.push({
      phase: 'Phase 3: Simple Common Components',
      components: simpleCommon,
      estimatedEffort: 'low',
      rationale: 'Highly reusable components without external dependencies',
    })
  }

  // Phase 4: Components needing Redux only
  const reduxComponents = uncovered
    .filter((c) => c.dependencies.needsRedux && !c.dependencies.needsWeb3 && !c.dependencies.needsMsw)
    .sort((a, b) => b.priorityScore - a.priorityScore)

  if (reduxComponents.length > 0) {
    workOrder.push({
      phase: 'Phase 4: Redux-dependent Components',
      components: reduxComponents,
      estimatedEffort: 'medium',
      rationale: 'Need StoreDecorator but no API mocking',
    })
  }

  // Phase 5: Components needing MSW
  const mswComponents = uncovered
    .filter((c) => c.dependencies.needsMsw && !c.dependencies.needsWeb3)
    .sort((a, b) => b.priorityScore - a.priorityScore)

  if (mswComponents.length > 0) {
    workOrder.push({
      phase: 'Phase 5: MSW-dependent Components',
      components: mswComponents,
      estimatedEffort: 'medium',
      rationale: 'Need API mocking with MSW handlers',
    })
  }

  // Phase 6: Complex components (Web3, multiple dependencies)
  const complexComponents = uncovered
    .filter((c) => c.dependencies.needsWeb3 || (c.dependencies.needsRedux && c.dependencies.needsMsw))
    .sort((a, b) => b.priorityScore - a.priorityScore)

  if (complexComponents.length > 0) {
    workOrder.push({
      phase: 'Phase 6: Complex Components',
      components: complexComponents,
      estimatedEffort: 'high',
      rationale: 'Need Web3 mocking or multiple decorators',
    })
  }

  return workOrder
}
