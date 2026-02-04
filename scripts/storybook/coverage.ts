/**
 * Coverage Analysis
 *
 * Analyzes story files to determine coverage status for components.
 * Matches components to their corresponding .stories.tsx files.
 *
 * Key functions:
 * - analyzeStoryCoverage(components) → components with hasStory flag
 * - calculateCoverageStats(components) → { total, withStories, percentage }
 *
 * Used by: generate-storybook-coverage.ts
 */

import * as fs from 'fs'
import * as ts from 'typescript'
import type { ComponentEntry, StoryInfo } from './types'
import { EXPECTED_STATES } from './types'

// ============================================================================
// Component Type Detection
// ============================================================================

type ComponentType = 'async' | 'form' | 'toggle' | 'interactive' | 'default'

/** Patterns for detecting component types from name */
const NAME_PATTERNS: Array<{ type: ComponentType; patterns: string[] }> = [
  { type: 'form', patterns: ['input', 'form', 'field', 'textarea'] },
  { type: 'toggle', patterns: ['toggle', 'switch', 'checkbox'] },
  { type: 'interactive', patterns: ['button', 'select', 'dropdown', 'menu'] },
]

/** Detect component type from name patterns */
function detectTypeFromName(lowerName: string): ComponentType | null {
  for (const { type, patterns } of NAME_PATTERNS) {
    if (patterns.some((p) => lowerName.includes(p))) {
      return type
    }
  }
  return null
}

/** Check if component is async (has API calls) */
function isAsyncComponent(dependencies: ComponentEntry['dependencies']): boolean {
  return dependencies.needsMsw || dependencies.apiCalls.length > 0
}

/** Check if component is interactive UI */
function isInteractiveUI(category: string, lowerName: string): boolean {
  if (category !== 'ui') return false
  return ['button', 'select', 'dropdown', 'menu'].some((p) => lowerName.includes(p))
}

/**
 * Analyzes story coverage for components
 */
export function analyzeStoryCoverage(components: ComponentEntry[]): ComponentEntry[] {
  return components.map((component) => {
    if (component.hasStory && component.storyPath) {
      const storyInfo = analyzeStoryFile(component.storyPath, component)
      return {
        ...component,
        storyInfo,
      }
    }
    return component
  })
}

// ============================================================================
// Story File Analysis
// ============================================================================

/** Create a default story info for missing/errored files */
function createDefaultStoryInfo(storyPath: string, component: ComponentEntry): StoryInfo {
  return {
    path: storyPath,
    variants: [],
    isComplete: false,
    missingStates: getExpectedStates(component),
  }
}

/** Extract exported variant names from a TypeScript source file */
function extractVariantNames(sourceFile: ts.SourceFile): string[] {
  const variants: string[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return

    const hasExport = ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!hasExport) return

    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue

      const name = declaration.name.text
      if (name !== 'default' && name !== 'meta') {
        variants.push(name)
      }
    }
  })

  return variants
}

/** Find missing states by comparing variants against expected states */
function findMissingStates(variants: string[], expectedStates: string[]): string[] {
  return expectedStates.filter((state) => !variants.some((v) => v.toLowerCase().includes(state.toLowerCase())))
}

/**
 * Analyzes a story file to extract variant information
 */
function analyzeStoryFile(storyPath: string, component: ComponentEntry): StoryInfo {
  if (!fs.existsSync(storyPath)) {
    return createDefaultStoryInfo(storyPath, component)
  }

  try {
    const content = fs.readFileSync(storyPath, 'utf-8')
    const sourceFile = ts.createSourceFile(storyPath, content, ts.ScriptTarget.Latest, true)

    const variants = extractVariantNames(sourceFile)
    const expectedStates = getExpectedStates(component)
    const missingStates = findMissingStates(variants, expectedStates)

    return {
      path: storyPath,
      variants,
      isComplete: missingStates.length === 0,
      missingStates,
    }
  } catch {
    return createDefaultStoryInfo(storyPath, component)
  }
}

/**
 * Determines expected states for a component based on its type and dependencies
 */
function getExpectedStates(component: ComponentEntry): string[] {
  const { category, dependencies, name } = component
  const lowerName = name.toLowerCase()

  // Check in priority order
  if (isAsyncComponent(dependencies)) return EXPECTED_STATES.async

  const nameType = detectTypeFromName(lowerName)
  if (nameType) return EXPECTED_STATES[nameType]

  if (isInteractiveUI(category, lowerName)) return EXPECTED_STATES.interactive

  return EXPECTED_STATES.default
}

/**
 * Calculates overall coverage statistics
 */
export function calculateCoverageStats(components: ComponentEntry[]): {
  total: number
  withStories: number
  percentage: number
  complete: number
  incomplete: number
} {
  const total = components.length
  const withStories = components.filter((c) => c.hasStory).length
  const percentage = total > 0 ? Math.round((withStories / total) * 100) : 0

  // Count complete vs incomplete stories
  const componentsWithStoryInfo = components.filter((c) => c.hasStory && 'storyInfo' in c)
  const complete = componentsWithStoryInfo.filter(
    (c) => (c as ComponentEntry & { storyInfo: StoryInfo }).storyInfo?.isComplete,
  ).length
  const incomplete = withStories - complete

  return {
    total,
    withStories,
    percentage,
    complete,
    incomplete,
  }
}

/**
 * Groups components by category with coverage stats
 */
export function getCoverageByCategory(components: ComponentEntry[]): Array<{
  category: string
  total: number
  withStories: number
  percentage: number
}> {
  const categories = new Map<
    string,
    {
      total: number
      withStories: number
    }
  >()

  for (const component of components) {
    const existing = categories.get(component.category) || { total: 0, withStories: 0 }
    existing.total++
    if (component.hasStory) {
      existing.withStories++
    }
    categories.set(component.category, existing)
  }

  return Array.from(categories.entries())
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      withStories: stats.withStories,
      percentage: stats.total > 0 ? Math.round((stats.withStories / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Gets components without stories, sorted by priority
 */
export function getUncoveredComponents(components: ComponentEntry[]): ComponentEntry[] {
  return components.filter((c) => !c.hasStory).sort((a, b) => b.priorityScore - a.priorityScore)
}

/**
 * Gets components with incomplete story coverage
 */
export function getIncompleteComponents(components: ComponentEntry[]): ComponentEntry[] {
  return components.filter((c) => {
    if (!c.hasStory) return false
    const storyInfo = (c as ComponentEntry & { storyInfo?: StoryInfo }).storyInfo
    return storyInfo && !storyInfo.isComplete
  })
}
