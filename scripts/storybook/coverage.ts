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
import * as path from 'path'
import * as ts from 'typescript'
import type { ComponentEntry, StoryInfo } from './types'
import { EXPECTED_STATES } from './types'

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

/**
 * Analyzes a story file to extract variant information
 */
function analyzeStoryFile(storyPath: string, component: ComponentEntry): StoryInfo {
  const variants: string[] = []
  const missingStates: string[] = []

  try {
    if (!fs.existsSync(storyPath)) {
      return {
        path: storyPath,
        variants: [],
        isComplete: false,
        missingStates: getExpectedStates(component),
      }
    }

    const content = fs.readFileSync(storyPath, 'utf-8')
    const sourceFile = ts.createSourceFile(storyPath, content, ts.ScriptTarget.Latest, true)

    // Extract exported story variants
    ts.forEachChild(sourceFile, (node) => {
      // Look for exported const declarations (CSF3 format)
      if (ts.isVariableStatement(node)) {
        const modifiers = ts.getModifiers(node)
        const hasExport = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)

        if (hasExport) {
          for (const declaration of node.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name)) {
              const name = declaration.name.text
              // Skip meta export
              if (name !== 'default' && name !== 'meta') {
                variants.push(name)
              }
            }
          }
        }
      }
    })

    // Determine expected states based on component type
    const expectedStates = getExpectedStates(component)

    // Check for missing states
    for (const state of expectedStates) {
      const hasState = variants.some((v) => v.toLowerCase().includes(state.toLowerCase()))
      if (!hasState) {
        missingStates.push(state)
      }
    }

    return {
      path: storyPath,
      variants,
      isComplete: missingStates.length === 0,
      missingStates,
    }
  } catch {
    return {
      path: storyPath,
      variants: [],
      isComplete: false,
      missingStates: getExpectedStates(component),
    }
  }
}

/**
 * Determines expected states for a component based on its type and dependencies
 */
function getExpectedStates(component: ComponentEntry): string[] {
  const { category, dependencies, name } = component
  const lowerName = name.toLowerCase()

  // Async components (API calls, loading states)
  if (dependencies.needsMsw || dependencies.apiCalls.length > 0) {
    return EXPECTED_STATES.async
  }

  // Form components
  if (
    lowerName.includes('input') ||
    lowerName.includes('form') ||
    lowerName.includes('field') ||
    lowerName.includes('textarea')
  ) {
    return EXPECTED_STATES.form
  }

  // Toggle/switch components
  if (lowerName.includes('toggle') || lowerName.includes('switch') || lowerName.includes('checkbox')) {
    return EXPECTED_STATES.toggle
  }

  // Interactive UI components
  if (category === 'ui') {
    // Buttons, selects, inputs
    if (
      lowerName.includes('button') ||
      lowerName.includes('select') ||
      lowerName.includes('dropdown') ||
      lowerName.includes('menu')
    ) {
      return EXPECTED_STATES.interactive
    }
  }

  // Default: just need a Default state
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
