/**
 * Family & Group Hierarchies
 *
 * Groups components into families (by directory) and top-level groups.
 * Enables hierarchical coverage tracking where one story can cover many components.
 *
 * Key functions:
 * - groupComponentsIntoFamilies(components) → ComponentFamily[]
 * - groupFamiliesIntoTopLevel(families) → TopLevelGroup[]
 * - calculateFamilyCoverage/calculateTopLevelCoverage → coverage stats
 *
 * Used by: generate-storybook-coverage.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'
import type {
  ComponentEntry,
  ComponentFamily,
  ComponentCategory,
  FamilyCategoryCoverage,
  TopLevelGroup,
  TopLevelCoverageReport,
} from './types'

/**
 * Groups components into families based on their directory structure.
 * A family is a group of components in the same directory that can be
 * covered by a single story file with multiple exports.
 */
export function groupComponentsIntoFamilies(components: ComponentEntry[]): ComponentFamily[] {
  const familyMap = new Map<string, ComponentEntry[]>()

  // Group components by their parent directory
  for (const component of components) {
    const familyPath = getFamilyPath(component.path)
    const existing = familyMap.get(familyPath) || []
    existing.push(component)
    familyMap.set(familyPath, existing)
  }

  // Convert to ComponentFamily objects
  const families: ComponentFamily[] = []
  for (const [familyPath, componentEntries] of familyMap) {
    const family = createFamily(familyPath, componentEntries)
    families.push(family)
  }

  return families.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Determines the family path for a component.
 * Components in the same directory belong to the same family.
 */
function getFamilyPath(componentPath: string): string {
  // Get the directory containing the component
  const dir = path.dirname(componentPath)

  // If the component is directly in a category folder (e.g., components/common/Component.tsx),
  // use the component's own name as the family
  const parts = dir.split('/')
  const lastPart = parts[parts.length - 1]

  // If the last part is a category folder, use the component file name as family identifier
  const categoryFolders = ['common', 'ui', 'sidebar', 'layout', 'pages', 'features']
  if (categoryFolders.includes(lastPart.toLowerCase())) {
    return componentPath.replace('.tsx', '')
  }

  return dir
}

/**
 * Creates a ComponentFamily from a group of components.
 */
function createFamily(familyPath: string, componentEntries: ComponentEntry[]): ComponentFamily {
  // Sort entries for deterministic output
  const sortedEntries = [...componentEntries].sort((a, b) => a.path.localeCompare(b.path))
  const familyName = getFamilyName(familyPath)
  const category = sortedEntries[0]?.category || 'other'
  const componentNames = sortedEntries.map((c) => c.name)

  // Find story file and analyze exports
  const { storyFile, storyExports, storyExportNames } = findFamilyStory(familyPath, sortedEntries)

  // Determine coverage status
  const coverage = determineCoverageStatus(sortedEntries, storyExports)

  return {
    name: familyName,
    path: familyPath,
    components: componentNames,
    componentEntries: sortedEntries,
    storyFile,
    storyExports,
    storyExportNames,
    coverage,
    category,
  }
}

/**
 * Gets a human-readable name for a family from its path.
 */
function getFamilyName(familyPath: string): string {
  const parts = familyPath.split('/')
  // Get the last meaningful part of the path
  const lastPart = parts[parts.length - 1]

  // If it looks like a component file (PascalCase), use it directly
  if (/^[A-Z]/.test(lastPart)) {
    return lastPart
  }

  // Otherwise, capitalize the directory name
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
}

/**
 * Finds the story file for a family and analyzes its exports.
 */
function findFamilyStory(
  familyPath: string,
  componentEntries: ComponentEntry[],
): {
  storyFile?: string
  storyExports: number
  storyExportNames: string[]
} {
  const rootDir = getRootDir()

  // First, check if any component in the family has a story
  const componentWithStory = componentEntries.find((c) => c.hasStory && c.storyPath)
  if (componentWithStory && componentWithStory.storyPath) {
    // storyPath from scanner is a full path, analyze it directly
    const exports = analyzeStoryExports(componentWithStory.storyPath)
    // Make path relative for display
    const relativePath = componentWithStory.storyPath.replace(rootDir + '/', '').replace(rootDir, '')
    return {
      storyFile: relativePath,
      storyExports: exports.length,
      storyExportNames: exports,
    }
  }

  // Check for a story file matching the family name
  const fullFamilyPath = path.join(rootDir, familyPath)

  // Try common story file patterns
  const familyName = getFamilyName(familyPath)
  const storyPatterns = [
    path.join(fullFamilyPath, `${familyName}.stories.tsx`),
    path.join(fullFamilyPath, 'index.stories.tsx'),
    `${fullFamilyPath}.stories.tsx`,
  ]

  for (const storyPath of storyPatterns) {
    if (fs.existsSync(storyPath)) {
      const exports = analyzeStoryExports(storyPath)
      // Make path relative
      const relativePath = storyPath.replace(rootDir + '/', '')
      return {
        storyFile: relativePath,
        storyExports: exports.length,
        storyExportNames: exports,
      }
    }
  }

  return {
    storyFile: undefined,
    storyExports: 0,
    storyExportNames: [],
  }
}

/**
 * Gets the root directory for source files.
 */
function getRootDir(): string {
  const cwd = process.cwd()
  return cwd.endsWith('apps/web') ? 'src' : 'apps/web/src'
}

/**
 * Resolves the full path to a story file, handling both absolute and relative paths.
 * Returns null if the file doesn't exist.
 */
function resolveStoryPath(storyPath: string): string | null {
  if (fs.existsSync(storyPath)) {
    return storyPath
  }

  const rootDir = getRootDir()
  const fullPath = path.join(rootDir, storyPath)

  if (fs.existsSync(fullPath)) {
    return fullPath
  }

  return null
}

/**
 * Extracts exported story names from a TypeScript source file.
 * Filters out meta, default, and __namedExportsOrder exports.
 */
function extractStoryExportNames(sourceFile: ts.SourceFile): string[] {
  const exports: string[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return

    const modifiers = ts.getModifiers(node)
    const hasExport = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (!hasExport) return

    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue

      const name = declaration.name.text
      if (name !== 'default' && name !== 'meta' && name !== '__namedExportsOrder') {
        exports.push(name)
      }
    }
  })

  return exports
}

/**
 * Analyzes a story file to extract all exported story names.
 */
function analyzeStoryExports(storyPath: string): string[] {
  const fullPath = resolveStoryPath(storyPath)
  if (!fullPath) return []

  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    const sourceFile = ts.createSourceFile(fullPath, content, ts.ScriptTarget.Latest, true)
    return extractStoryExportNames(sourceFile).sort()
  } catch {
    return []
  }
}

/**
 * Determines the coverage status for a family.
 */
function determineCoverageStatus(
  componentEntries: ComponentEntry[],
  storyExports: number,
): 'complete' | 'partial' | 'none' {
  const hasAnyStory = componentEntries.some((c) => c.hasStory) || storyExports > 0

  if (!hasAnyStory) {
    return 'none'
  }

  // A family is "complete" if it has at least one story export per component,
  // or if it has stories covering the main states (Default, Loading, Error, Empty)
  const minExports = Math.max(1, Math.ceil(componentEntries.length / 2))

  if (storyExports >= minExports) {
    return 'complete'
  }

  return 'partial'
}

/**
 * Calculates overall family coverage statistics.
 */
export function calculateFamilyCoverage(families: ComponentFamily[]): {
  totalFamilies: number
  coveredFamilies: number
  completeFamilies: number
  familyCoveragePercent: number
  totalStoryExports: number
} {
  const totalFamilies = families.length
  const coveredFamilies = families.filter((f) => f.coverage !== 'none').length
  const completeFamilies = families.filter((f) => f.coverage === 'complete').length
  const familyCoveragePercent = totalFamilies > 0 ? Math.round((coveredFamilies / totalFamilies) * 100) : 0
  const totalStoryExports = families.reduce((sum, f) => sum + f.storyExports, 0)

  return {
    totalFamilies,
    coveredFamilies,
    completeFamilies,
    familyCoveragePercent,
    totalStoryExports,
  }
}

/**
 * Groups families by category with coverage stats.
 */
export function getFamilyCoverageByCategory(families: ComponentFamily[]): FamilyCategoryCoverage[] {
  const categories = new Map<
    ComponentCategory,
    {
      totalFamilies: number
      coveredFamilies: number
      storyExports: number
    }
  >()

  for (const family of families) {
    const existing = categories.get(family.category) || { totalFamilies: 0, coveredFamilies: 0, storyExports: 0 }
    existing.totalFamilies++
    if (family.coverage !== 'none') {
      existing.coveredFamilies++
    }
    existing.storyExports += family.storyExports
    categories.set(family.category, existing)
  }

  return Array.from(categories.entries())
    .map(([category, stats]) => ({
      category,
      totalFamilies: stats.totalFamilies,
      coveredFamilies: stats.coveredFamilies,
      percentage: stats.totalFamilies > 0 ? Math.round((stats.coveredFamilies / stats.totalFamilies) * 100) : 0,
      storyExports: stats.storyExports,
    }))
    .sort((a, b) => {
      const diff = b.totalFamilies - a.totalFamilies
      // Secondary sort by category name for stable ordering
      return diff !== 0 ? diff : a.category.localeCompare(b.category)
    })
}

/**
 * Gets families without any story coverage.
 */
export function getUncoveredFamilies(families: ComponentFamily[]): ComponentFamily[] {
  return families.filter((f) => f.coverage === 'none')
}

/**
 * Gets families with partial coverage that need more stories.
 */
export function getPartialFamilies(families: ComponentFamily[]): ComponentFamily[] {
  return families.filter((f) => f.coverage === 'partial')
}

/**
 * Groups families into top-level groups based on their root directory.
 * This enables "one story covers all" approach where a single story
 * for Sidebar covers all sidebar sub-components.
 */
export function groupFamiliesIntoTopLevel(families: ComponentFamily[]): TopLevelGroup[] {
  const groupMap = new Map<string, ComponentFamily[]>()

  // Group families by their top-level directory
  for (const family of families) {
    const topLevelPath = getTopLevelPath(family.path)
    const existing = groupMap.get(topLevelPath) || []
    existing.push(family)
    groupMap.set(topLevelPath, existing)
  }

  // Convert to TopLevelGroup objects
  const groups: TopLevelGroup[] = []
  for (const [rootPath, familyList] of groupMap) {
    const group = createTopLevelGroup(rootPath, familyList)
    groups.push(group)
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Gets the top-level path for a family (e.g., "components/sidebar/SidebarHeader" → "components/sidebar")
 */
function getTopLevelPath(familyPath: string): string {
  const parts = familyPath.split('/')

  // Handle different path patterns:
  // - components/sidebar/... → components/sidebar
  // - features/swap/components/... → features/swap
  // - pages/... → pages

  if (parts[0] === 'components' && parts.length > 1) {
    return `${parts[0]}/${parts[1]}`
  }

  if (parts[0] === 'features' && parts.length > 1) {
    return `${parts[0]}/${parts[1]}`
  }

  if (parts[0] === 'pages') {
    return 'pages'
  }

  // For other paths, use first two parts or the whole path
  return parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0]
}

/**
 * Creates a TopLevelGroup from a list of families.
 */
function createTopLevelGroup(rootPath: string, families: ComponentFamily[]): TopLevelGroup {
  // Sort families for deterministic output
  const sortedFamilies = [...families].sort((a, b) => a.path.localeCompare(b.path))
  const name = getTopLevelName(rootPath)
  const category = sortedFamilies[0]?.category || 'other'
  const totalComponents = sortedFamilies.reduce((sum, f) => sum + f.components.length, 0)

  // Check for a top-level story (e.g., Sidebar.stories.tsx or index.stories.tsx)
  const { storyPath, storyExports } = findTopLevelStory(rootPath, sortedFamilies)

  // Coverage is complete if there's a top-level story OR all families have stories
  const hasTopLevelStory = storyExports > 0
  const allFamiliesCovered = sortedFamilies.every((f) => f.coverage !== 'none')
  const someFamiliesCovered = sortedFamilies.some((f) => f.coverage !== 'none')

  let coverage: 'complete' | 'partial' | 'none'
  if (hasTopLevelStory || allFamiliesCovered) {
    coverage = 'complete'
  } else if (someFamiliesCovered) {
    coverage = 'partial'
  } else {
    coverage = 'none'
  }

  return {
    name,
    rootPath,
    category,
    families: sortedFamilies,
    totalComponents,
    hasStory: hasTopLevelStory,
    storyPath,
    storyExports,
    coverage,
  }
}

/**
 * Gets a human-readable name for a top-level group.
 */
function getTopLevelName(rootPath: string): string {
  const parts = rootPath.split('/')
  const lastPart = parts[parts.length - 1]

  // Capitalize and clean up the name
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
}

/**
 * Finds a top-level story for a group.
 */
function findTopLevelStory(
  rootPath: string,
  families: ComponentFamily[],
): { storyPath?: string; storyExports: number } {
  const rootDir = getRootDir()
  const fullPath = path.join(rootDir, rootPath)
  const groupName = getTopLevelName(rootPath)

  // Try common top-level story patterns
  const storyPatterns = [
    path.join(fullPath, `${groupName}.stories.tsx`),
    path.join(fullPath, 'index.stories.tsx'),
    path.join(fullPath, `${groupName.toLowerCase()}.stories.tsx`),
  ]

  for (const storyPath of storyPatterns) {
    if (fs.existsSync(storyPath)) {
      const exports = analyzeStoryExportsFromFile(storyPath)
      return {
        storyPath: storyPath.replace(rootDir + '/', ''),
        storyExports: exports.length,
      }
    }
  }

  // Sum up exports from all family stories
  const totalExports = families.reduce((sum, f) => sum + f.storyExports, 0)

  return {
    storyPath: undefined,
    storyExports: totalExports,
  }
}

/**
 * Analyzes story exports from a file path.
 */
function analyzeStoryExportsFromFile(storyPath: string): string[] {
  if (!fs.existsSync(storyPath)) return []

  try {
    const content = fs.readFileSync(storyPath, 'utf-8')
    const sourceFile = ts.createSourceFile(storyPath, content, ts.ScriptTarget.Latest, true)
    return extractStoryExportNames(sourceFile).sort()
  } catch {
    return []
  }
}

/**
 * Calculates top-level coverage statistics.
 */
export function calculateTopLevelCoverage(groups: TopLevelGroup[]): TopLevelCoverageReport {
  const totalGroups = groups.length
  const coveredGroups = groups.filter((g) => g.coverage !== 'none').length
  const coveragePercent = totalGroups > 0 ? Math.round((coveredGroups / totalGroups) * 100) : 0
  const totalStoryExports = groups.reduce((sum, g) => sum + g.storyExports, 0)

  // Group by category
  const categoryMap = new Map<ComponentCategory, { total: number; covered: number }>()
  for (const group of groups) {
    const existing = categoryMap.get(group.category) || { total: 0, covered: 0 }
    existing.total++
    if (group.coverage !== 'none') {
      existing.covered++
    }
    categoryMap.set(group.category, existing)
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      covered: stats.covered,
      percentage: stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0,
    }))
    .sort((a, b) => {
      const diff = b.total - a.total
      // Secondary sort by category name for stable ordering
      return diff !== 0 ? diff : a.category.localeCompare(b.category)
    })

  return {
    timestamp: new Date().toISOString(),
    totalGroups,
    coveredGroups,
    coveragePercent,
    totalStoryExports,
    byCategory,
    groups: groups.sort((a, b) => {
      const statusOrder = { none: 0, partial: 1, complete: 2 }
      const statusDiff = statusOrder[a.coverage] - statusOrder[b.coverage]
      // Secondary sort by name for stable ordering
      return statusDiff !== 0 ? statusDiff : a.name.localeCompare(b.name)
    }),
  }
}
