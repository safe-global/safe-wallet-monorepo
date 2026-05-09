#!/usr/bin/env npx ts-node

/**
 * Storybook Coverage Report Generator
 *
 * Generates COVERAGE.md documenting story coverage across three levels:
 * - Top-level groups (e.g., "Sidebar", "Dashboard")
 * - Families (component directories)
 * - Individual components
 *
 * Coverage cascades: group story → covers all families → covers all components
 *
 * Usage: yarn workspace @safe-global/web storybook:generate-coverage
 * Output: apps/web/.storybook/COVERAGE.md
 */

import * as fs from 'fs'
import * as path from 'path'
import { scanComponents } from './scanner'
import { analyzeStoryCoverage, calculateCoverageStats, getCoverageByCategory } from './coverage'
import {
  groupComponentsIntoFamilies,
  calculateFamilyCoverage,
  groupFamiliesIntoTopLevel,
  calculateTopLevelCoverage,
} from './family'
import { calculatePriorityScores } from './priority'
import type { ComponentEntry, ComponentFamily, TopLevelGroup, TopLevelCoverageReport } from './types'

/** Groups that are intentionally skipped from coverage requirements */
const SKIPPED_GROUPS: Record<string, string> = {
  Pages: 'Page routes, not visual components - tested via E2E',
  Stories: 'Test decorator utilities for Storybook itself',
  Terms: 'Simple static legal content',
  Theme: 'Theme provider wrapper with no visual output',
  Wrappers: 'HOC wrappers (Disclaimer, Feature, Sanction) - infrastructure only',
}

/** Coverage info for a component */
type ComponentCoverage =
  | { type: 'own' }
  | { type: 'family'; familyName: string }
  | { type: 'group'; groupName: string }
  | { type: 'none' }

// ============================================================================
// Helper Functions
// ============================================================================

/** Format coverage source for display */
function formatCoverageSource(coverage: ComponentCoverage | undefined, comp: ComponentEntry): string {
  switch (coverage?.type) {
    case 'own': {
      const storyFile = comp.storyPath ? path.basename(comp.storyPath) : 'unknown'
      const storyName =
        storyFile === 'index.stories.tsx'
          ? path.basename(path.dirname(comp.storyPath || ''))
          : storyFile.replace('.stories.tsx', '')
      return `Own story (${storyName})`
    }
    case 'family':
      return `Family (${coverage.familyName})`
    case 'group':
      return `Group (${coverage.groupName})`
    default:
      return 'Unknown'
  }
}

/** Partition components by coverage status */
function partitionByCoverage(
  components: ComponentEntry[],
  coverageMap: Map<string, ComponentCoverage>,
): { covered: ComponentEntry[]; uncovered: ComponentEntry[] } {
  const covered: ComponentEntry[] = []
  const uncovered: ComponentEntry[] = []

  for (const comp of components) {
    const type = coverageMap.get(comp.path)?.type
    if (type === 'own' || type === 'family' || type === 'group') {
      covered.push(comp)
    } else {
      uncovered.push(comp)
    }
  }

  return { covered, uncovered }
}

/** Build a map of family path → group info */
function buildGroupInfoMap(groups: TopLevelGroup[]): Map<string, { name: string; isCovered: boolean }> {
  const map = new Map<string, { name: string; isCovered: boolean }>()
  for (const group of groups) {
    const isCovered = group.coverage !== 'none'
    for (const family of group.families) {
      map.set(family.path, { name: group.name, isCovered })
    }
  }
  return map
}

/** Determine coverage type for a component based on hierarchy */
function determineCoverageType(
  entry: ComponentEntry,
  familyIsCovered: boolean,
  familyName: string,
  groupInfo: { name: string; isCovered: boolean } | undefined,
): ComponentCoverage {
  if (entry.hasStory) return { type: 'own' }
  if (familyIsCovered) return { type: 'family', familyName }
  if (groupInfo?.isCovered) return { type: 'group', groupName: groupInfo.name }
  return { type: 'none' }
}

/** Build a map of component path → coverage source with details */
function buildComponentCoverageMap(
  families: ComponentFamily[],
  groups: TopLevelGroup[],
): Map<string, ComponentCoverage> {
  const map = new Map<string, ComponentCoverage>()
  const groupInfoMap = buildGroupInfoMap(groups)

  for (const family of families) {
    const groupInfo = groupInfoMap.get(family.path)
    const familyIsCovered = family.coverage !== 'none'

    for (const entry of family.componentEntries) {
      const coverage = determineCoverageType(entry, familyIsCovered, family.name, groupInfo)
      map.set(entry.path, coverage)
    }
  }

  return map
}

/** Check if a component is covered (by own story, family, or group) */
function isComponentCovered(comp: ComponentEntry, coverageMap: Map<string, ComponentCoverage>): boolean {
  const coverage = coverageMap.get(comp.path)
  return coverage?.type === 'own' || coverage?.type === 'family' || coverage?.type === 'group'
}

/** Calculate family coverage including group-level coverage */
function calculateFamilyCoverageWithGroups(
  families: ComponentFamily[],
  groups: TopLevelGroup[],
): { coveredFamilies: number; totalFamilies: number; coveragePercent: number } {
  // Build a map of family path → whether its group is covered
  const groupCoverageMap = new Map<string, boolean>()
  for (const group of groups) {
    const groupIsCovered = group.coverage !== 'none'
    for (const family of group.families) {
      groupCoverageMap.set(family.path, groupIsCovered)
    }
  }

  // A family is covered if it has its own story OR its group has a story
  const coveredFamilies = families.filter((f) => f.coverage !== 'none' || groupCoverageMap.get(f.path) === true).length

  return {
    coveredFamilies,
    totalFamilies: families.length,
    coveragePercent: Math.round((coveredFamilies / families.length) * 100),
  }
}

async function main() {
  console.log('📝 Storybook Coverage Documentation Generator')
  console.log('==============================================\n')

  // Scan components
  console.log('Scanning components...')
  let components = await scanComponents({ verbose: false })

  // Calculate priority scores and analyze coverage
  console.log('Analyzing coverage...')
  components = calculatePriorityScores(components)
  components = analyzeStoryCoverage(components)

  // Group into families and top-level groups
  console.log('Grouping into families and top-level groups...')
  const families = groupComponentsIntoFamilies(components)
  const groups = groupFamiliesIntoTopLevel(families)
  const topLevelReport = calculateTopLevelCoverage(groups)

  // Build component coverage map (considers group, family, and own story coverage)
  const componentCoverageMap = buildComponentCoverageMap(families, groups)

  // Calculate stats (group/family-aware)
  const componentStats = calculateCoverageStats(components)
  const familyStatsRaw = calculateFamilyCoverage(families)
  const familyStatsWithGroups = calculateFamilyCoverageWithGroups(families, groups)
  const coveredComponents = components.filter((c) => isComponentCovered(c, componentCoverageMap))
  const componentCoveragePercent = Math.round((coveredComponents.length / components.length) * 100)

  // Generate markdown
  console.log('Generating COVERAGE.md...')
  const markdown = generateCoverageMarkdown({
    components,
    families,
    groups,
    topLevelReport,
    componentStats,
    familyStats: familyStatsRaw,
    familyStatsWithGroups,
    componentCoverageMap,
    coveredComponentCount: coveredComponents.length,
    componentCoveragePercent,
  })

  // Determine output path
  const cwd = process.cwd()
  const outputPath = cwd.endsWith('apps/web') ? '.storybook/COVERAGE.md' : 'apps/web/.storybook/COVERAGE.md'

  // Write the file
  fs.writeFileSync(outputPath, markdown)
  console.log(`\n✅ Coverage documentation saved to: ${outputPath}`)
  console.log(`\n📊 Summary:`)
  console.log(
    `   - Top-level groups: ${topLevelReport.totalGroups} (${topLevelReport.coveredGroups} covered, ${topLevelReport.coveragePercent}%)`,
  )
  console.log(
    `   - Families: ${familyStatsWithGroups.totalFamilies} (${familyStatsWithGroups.coveredFamilies} covered, ${familyStatsWithGroups.coveragePercent}%)`,
  )
  console.log(
    `   - Components: ${componentStats.total} (${coveredComponents.length} covered, ${componentCoveragePercent}%)`,
  )
  console.log(`   - Story exports: ${topLevelReport.totalStoryExports}`)
}

interface GenerateOptions {
  components: ComponentEntry[]
  families: ComponentFamily[]
  groups: TopLevelGroup[]
  topLevelReport: TopLevelCoverageReport
  componentStats: ReturnType<typeof calculateCoverageStats>
  familyStats: ReturnType<typeof calculateFamilyCoverage>
  familyStatsWithGroups: { coveredFamilies: number; totalFamilies: number; coveragePercent: number }
  componentCoverageMap: Map<string, ComponentCoverage>
  coveredComponentCount: number
  componentCoveragePercent: number
}

function generateCoverageMarkdown(options: GenerateOptions): string {
  const {
    components,
    families,
    groups,
    topLevelReport,
    componentStats,
    familyStats,
    familyStatsWithGroups,
    componentCoverageMap,
    coveredComponentCount,
    componentCoveragePercent,
  } = options
  const timestamp = new Date().toISOString()

  let md = `# Storybook Coverage Documentation

> Auto-generated by \`yarn storybook:generate-coverage\`
> Last updated: ${timestamp}

This document tracks Storybook story coverage across the codebase, enabling historical tracking and progress monitoring.

---

## Summary

| Metric | Value |
|--------|-------|
| Total Top-Level Groups | ${topLevelReport.totalGroups} |
| Covered Groups | ${topLevelReport.coveredGroups} (${topLevelReport.coveragePercent}%) |
| Total Families | ${familyStatsWithGroups.totalFamilies} |
| Covered Families | ${familyStatsWithGroups.coveredFamilies} (${familyStatsWithGroups.coveragePercent}%) |
| Total Components | ${componentStats.total} |
| Components Covered | ${coveredComponentCount} (${componentCoveragePercent}%) |
| Total Story Exports | ${topLevelReport.totalStoryExports} |

---

`

  // Section 1: Top-Level Coverage
  md += generateTopLevelSection(groups, topLevelReport)

  // Section 2: Family Coverage
  md += generateFamilySection(families, groups)

  // Section 3: Component Coverage
  md += generateComponentSection(components, componentCoverageMap)

  return md
}

/** Generate markdown row for a covered group */
function formatCoveredGroupRow(group: TopLevelGroup): string {
  const storyFile = group.storyPath ? `\`${group.storyPath}\`` : '(family stories)'
  const status = group.coverage === 'complete' ? '✅' : '⚠️'
  return `| ${group.name} | ${group.category} | ${group.families.length} | ${group.totalComponents} | ${storyFile} | ${group.storyExports} | ${status} |\n`
}

/** Generate markdown row for an uncovered group */
function formatUncoveredGroupRow(group: TopLevelGroup): string {
  return `| ${group.name} | ${group.category} | ${group.families.length} | ${group.totalComponents} | Create \`${group.rootPath}/index.stories.tsx\` |\n`
}

/** Generate markdown row for a skipped group */
function formatSkippedGroupRow(group: TopLevelGroup): string {
  return `| ${group.name} | ${SKIPPED_GROUPS[group.name]} |\n`
}

/** Generate uncovered groups subsection */
function generateUncoveredGroupsSection(groups: TopLevelGroup[]): string {
  if (groups.length === 0) return ''

  const header = `
### ❌ Uncovered Groups (${groups.length})

| Group | Category | Families | Components | Action Needed |
|-------|----------|----------|------------|---------------|
`
  const rows = groups
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(formatUncoveredGroupRow)
    .join('')

  return header + rows
}

/** Generate skipped groups subsection */
function generateSkippedGroupsSection(groups: TopLevelGroup[]): string {
  if (groups.length === 0) return ''

  const header = `
### 🚫 Skipped Groups (${groups.length})

| Group | Reason |
|-------|--------|
`
  const rows = groups
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(formatSkippedGroupRow)
    .join('')

  return header + rows
}

function generateTopLevelSection(groups: TopLevelGroup[], report: TopLevelCoverageReport): string {
  const coveredGroups = groups.filter((g) => g.coverage !== 'none')
  const skippedGroups = groups.filter((g) => SKIPPED_GROUPS[g.name])
  const uncoveredGroups = groups.filter((g) => g.coverage === 'none' && !SKIPPED_GROUPS[g.name])

  const header = `## 1. Top-Level Coverage (${report.totalGroups} groups)

High-level view - each group can be covered by ONE story file.

### ✅ Covered Groups (${coveredGroups.length})

| Group | Category | Families | Components | Story File | Exports | Status |
|-------|----------|----------|------------|------------|---------|--------|
`

  const coveredRows = coveredGroups
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(formatCoveredGroupRow)
    .join('')

  return (
    header +
    coveredRows +
    generateUncoveredGroupsSection(uncoveredGroups) +
    generateSkippedGroupsSection(skippedGroups) +
    '\n---\n\n'
  )
}

function generateFamilySection(families: ComponentFamily[], groups: TopLevelGroup[]): string {
  let md = `## 2. Family Coverage (${families.length} families)

Mid-level view - components grouped by directory.

> **Note:** Families are "covered" if they have their own story OR their group has a top-level story.

`

  // Group families by their top-level group for organization
  for (const group of groups.sort((a, b) => a.name.localeCompare(b.name))) {
    const groupFamilies = group.families
    const groupHasStory = group.coverage !== 'none'
    // A family is covered if it has its own story OR the group has a top-level story
    const coveredCount = groupHasStory
      ? groupFamilies.length // All families covered by group story
      : groupFamilies.filter((f) => f.coverage !== 'none').length
    const familiesWithOwnStory = groupFamilies.filter((f) => f.coverage !== 'none').length
    const totalExports = groupFamilies.reduce((sum, f) => sum + f.storyExports, 0) + group.storyExports

    // Emoji reflects actual coverage status
    const allCovered = coveredCount === groupFamilies.length
    const statusEmoji = allCovered ? '✅' : coveredCount > 0 ? '⚠️' : '❌'

    // Show coverage source in summary
    const coverageNote =
      groupHasStory && familiesWithOwnStory === 0
        ? `via group story`
        : familiesWithOwnStory > 0
          ? `${familiesWithOwnStory} with own stories`
          : ''

    md += `<details>
<summary>📁 ${group.name} (${groupFamilies.length} families, ${group.totalComponents} components) - ${statusEmoji} ${coveredCount}/${groupFamilies.length} covered${coverageNote ? ` (${coverageNote})` : ''}, ${totalExports} exports</summary>

| Family | Path | Components | Story | Exports |
|--------|------|------------|-------|---------|
`

    for (const family of groupFamilies.sort((a, b) => a.name.localeCompare(b.name))) {
      // Show group story indicator if family doesn't have own story but group does
      const storyDisplay = family.storyFile
        ? `\`${path.basename(family.storyFile)}\``
        : groupHasStory
          ? `↑ group (${group.name})`
          : '—'
      const exportsList =
        family.storyExportNames.length > 0
          ? family.storyExportNames.slice(0, 3).join(', ') + (family.storyExportNames.length > 3 ? '...' : '')
          : '—'
      md += `| ${family.name} | ${family.path} | ${family.components.length} | ${storyDisplay} | ${exportsList} |\n`
    }

    md += '\n</details>\n\n'
  }

  md += '---\n\n'
  return md
}

function generateComponentSection(
  components: ComponentEntry[],
  componentCoverageMap: Map<string, ComponentCoverage>,
): string {
  const { covered, uncovered } = partitionByCoverage(components, componentCoverageMap)

  let md = `## 3. Component Coverage (${components.length} components)

Detailed view - every component with its coverage status.

> **Note:** A component is considered "covered" if it has its own story file, belongs to a family with stories, or belongs to a group with a top-level story.

<details>
<summary>✅ Components Covered (${covered.length}) - click to expand</summary>

| Component | Category | Path | Coverage Source |
|-----------|----------|------|-----------------|
`

  for (const comp of covered.sort((a, b) => a.name.localeCompare(b.name))) {
    const coverage = componentCoverageMap.get(comp.path)
    const source = formatCoverageSource(coverage, comp)
    md += `| ${comp.name} | ${comp.category} | ${comp.path} | ${source} |\n`
  }

  md += `
</details>

<details>
<summary>❌ Components Not Covered (${uncovered.length}) - click to expand</summary>

| Component | Category | Path | Priority Score |
|-----------|----------|------|----------------|
`

  // Sort by priority score descending (highest priority first)
  for (const comp of uncovered.sort((a, b) => b.priorityScore - a.priorityScore)) {
    md += `| ${comp.name} | ${comp.category} | ${comp.path} | ${comp.priorityScore} |\n`
  }

  md += `
</details>

---

## How to Use This Document

### Regenerating

Run when story files change:

\`\`\`bash
yarn workspace @safe-global/web storybook:generate-coverage
\`\`\`

### Understanding Coverage

- **Top-Level Groups**: Highest-level organization (41 groups). Aim for one story per group.
- **Families**: Component directories that should be covered by related stories.
- **Components**: Individual component files. Not all need dedicated stories.

### Coverage Strategy

1. **Top-level first**: Create \`index.stories.tsx\` in each major directory
2. **Story exports**: Each export = one Chromatic snapshot
3. **Family-based**: Group related components in one story file

### Priority Scores

Higher scores indicate components that should be prioritized:
- **Sidebar components**: +15 (critical for page stories)
- **UI primitives**: +10 (high reuse)
- **Common components**: +8 (shared across features)
- **High dependents**: +5 per dependent component
`

  return md
}

main().catch((error) => {
  console.error('Error generating coverage documentation:', error)
  process.exit(1)
})
