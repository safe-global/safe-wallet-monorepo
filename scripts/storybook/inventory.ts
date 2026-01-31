#!/usr/bin/env npx ts-node

/**
 * Component Inventory Script
 *
 * Scans the codebase for React components and generates an inventory
 * with coverage analysis and priority scoring.
 *
 * Usage: npx ts-node scripts/storybook/inventory.ts [--verbose] [--json] [--components] [--output <file>]
 *
 * Flags:
 *   --verbose, -v   Show detailed output
 *   --json          Output as JSON
 *   --components    Show individual component view instead of family grouping (legacy mode)
 *   --output, -o    Write output to file
 *
 * By default, components are grouped by family (directory) for cleaner coverage reporting.
 * Use --components for the legacy per-component view.
 */

import * as fs from 'fs'
import * as path from 'path'
import { scanComponents } from './scanner'
import { analyzeStoryCoverage, calculateCoverageStats, getCoverageByCategory } from './coverage'
import {
  groupComponentsIntoFamilies,
  calculateFamilyCoverage,
  getFamilyCoverageByCategory,
  groupFamiliesIntoTopLevel,
  calculateTopLevelCoverage,
} from './family'
import { calculatePriorityScores, getTopPriorityComponents, generateWorkOrder } from './priority'
import type { ComponentEntry, CoverageReport, FamilyCoverageReport, TopLevelCoverageReport } from './types'

interface InventoryOptions {
  verbose: boolean
  json: boolean
  /** Legacy mode: show individual components instead of family grouping */
  components: boolean
  /** Top-level mode: group families into higher-level groups (e.g., all sidebar families → "Sidebar") */
  toplevel: boolean
  output?: string
}

async function main() {
  const args = process.argv.slice(2)
  const options: InventoryOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    json: args.includes('--json'),
    components: args.includes('--components'),
    toplevel: args.includes('--toplevel') || args.includes('-t'),
    output: getArgValue(args, '--output') || getArgValue(args, '-o'),
  }

  console.log('📦 Component Inventory Scanner')
  console.log('==============================\n')

  // Scan components
  console.log('Scanning for components...')
  let components = await scanComponents({ verbose: options.verbose })

  // Calculate priority scores
  console.log('Calculating priority scores...')
  components = calculatePriorityScores(components)

  // Analyze story coverage
  console.log('Analyzing story coverage...')
  components = analyzeStoryCoverage(components)

  if (options.components) {
    // Legacy component-based reporting (opt-in with --components flag)
    const report = generateReport(components)

    if (options.json) {
      const jsonOutput = JSON.stringify(report, null, 2)
      if (options.output) {
        fs.writeFileSync(options.output, jsonOutput)
        console.log(`\nReport saved to ${options.output}`)
      } else {
        console.log(jsonOutput)
      }
    } else {
      printReport(report, components, options.verbose)
    }
  } else if (options.toplevel) {
    // Top-level grouping (--toplevel flag)
    console.log('Grouping components into top-level groups...')
    const families = groupComponentsIntoFamilies(components)
    const groups = groupFamiliesIntoTopLevel(families)
    const topLevelReport = calculateTopLevelCoverage(groups)

    if (options.json) {
      const jsonOutput = JSON.stringify(topLevelReport, null, 2)
      if (options.output) {
        fs.writeFileSync(options.output, jsonOutput)
        console.log(`\nTop-level report saved to ${options.output}`)
      } else {
        console.log(jsonOutput)
      }
    } else {
      printTopLevelReport(topLevelReport, options.verbose)
    }
  } else {
    // Family-based reporting (default)
    console.log('Grouping components into families...')
    const families = groupComponentsIntoFamilies(components)
    const familyReport = generateFamilyReport(families)

    if (options.json) {
      const jsonOutput = JSON.stringify(familyReport, null, 2)
      if (options.output) {
        fs.writeFileSync(options.output, jsonOutput)
        console.log(`\nFamily report saved to ${options.output}`)
      } else {
        console.log(jsonOutput)
      }
    } else {
      printFamilyReport(familyReport, options.verbose)
    }
  }
}

function generateReport(components: ComponentEntry[]): CoverageReport {
  const stats = calculateCoverageStats(components)
  const byCategory = getCoverageByCategory(components)

  return {
    timestamp: new Date().toISOString(),
    totalComponents: stats.total,
    componentsWithStories: stats.withStories,
    coveragePercentage: stats.percentage,
    byCategory: byCategory.map((c) => ({
      category: c.category as CoverageReport['byCategory'][0]['category'],
      total: c.total,
      withStories: c.withStories,
      percentage: c.percentage,
    })),
    uncoveredComponents: components.filter((c) => !c.hasStory).sort((a, b) => b.priorityScore - a.priorityScore),
    incompleteStories: components.filter((c) => {
      if (!c.hasStory) return false
      const storyInfo = (c as ComponentEntry & { storyInfo?: { isComplete: boolean } }).storyInfo
      return storyInfo && !storyInfo.isComplete
    }),
  }
}

function printReport(report: CoverageReport, components: ComponentEntry[], verbose: boolean): void {
  // Summary
  console.log('\n📊 Coverage Summary')
  console.log('-------------------')
  console.log(`Total Components: ${report.totalComponents}`)
  console.log(`With Stories: ${report.componentsWithStories}`)
  console.log(`Coverage: ${report.coveragePercentage}%`)

  // Coverage by category
  console.log('\n📁 Coverage by Category')
  console.log('-----------------------')
  for (const cat of report.byCategory) {
    const bar = createProgressBar(cat.percentage)
    console.log(`${cat.category.padEnd(12)} ${bar} ${cat.withStories}/${cat.total} (${cat.percentage}%)`)
  }

  // Top priority components
  const topPriority = getTopPriorityComponents(components, 10)
  if (topPriority.length > 0) {
    console.log('\n🎯 Top Priority Components (need stories)')
    console.log('------------------------------------------')
    for (const comp of topPriority) {
      console.log(`  ${comp.name.padEnd(30)} [${comp.category}] Score: ${comp.priorityScore}`)
      if (verbose && comp.priorityReasons.length > 0) {
        for (const reason of comp.priorityReasons) {
          console.log(`    - ${reason}`)
        }
      }
    }
  }

  // Work order suggestion
  const workOrder = generateWorkOrder(components)
  if (workOrder.length > 0) {
    console.log('\n📋 Suggested Work Order')
    console.log('-----------------------')
    for (const phase of workOrder) {
      console.log(`\n${phase.phase} (${phase.components.length} components, effort: ${phase.estimatedEffort})`)
      console.log(`  Rationale: ${phase.rationale}`)
      if (verbose) {
        for (const comp of phase.components.slice(0, 5)) {
          console.log(`    - ${comp.name}`)
        }
        if (phase.components.length > 5) {
          console.log(`    ... and ${phase.components.length - 5} more`)
        }
      }
    }
  }

  console.log('\n✅ Inventory complete!')
}

function generateFamilyReport(families: import('./types').ComponentFamily[]): FamilyCoverageReport {
  const stats = calculateFamilyCoverage(families)
  const byCategory = getFamilyCoverageByCategory(families)

  return {
    timestamp: new Date().toISOString(),
    totalFamilies: stats.totalFamilies,
    coveredFamilies: stats.coveredFamilies,
    completeFamilies: stats.completeFamilies,
    familyCoveragePercent: stats.familyCoveragePercent,
    totalStoryExports: stats.totalStoryExports,
    byCategory,
    families: families.sort((a, b) => {
      // Sort by coverage status: none first (need attention), then partial, then complete
      const statusOrder = { none: 0, partial: 1, complete: 2 }
      return statusOrder[a.coverage] - statusOrder[b.coverage]
    }),
  }
}

function printFamilyReport(report: FamilyCoverageReport, verbose: boolean): void {
  // Summary
  console.log('\n📊 Family Coverage Summary')
  console.log('--------------------------')
  console.log(`Total Families: ${report.totalFamilies}`)
  console.log(`Covered Families: ${report.coveredFamilies}`)
  console.log(`Complete Families: ${report.completeFamilies}`)
  console.log(`Family Coverage: ${report.familyCoveragePercent}%`)
  console.log(`Total Story Exports: ${report.totalStoryExports}`)

  // Coverage by category
  console.log('\n📁 Family Coverage by Category')
  console.log('-------------------------------')
  for (const cat of report.byCategory) {
    const bar = createProgressBar(cat.percentage)
    console.log(
      `${cat.category.padEnd(12)} ${bar} ${cat.coveredFamilies}/${cat.totalFamilies} families (${cat.storyExports} exports)`,
    )
  }

  // Families needing coverage
  const uncoveredFamilies = report.families.filter((f) => f.coverage === 'none')
  const partialFamilies = report.families.filter((f) => f.coverage === 'partial')

  if (uncoveredFamilies.length > 0) {
    console.log('\n❌ Families Without Stories')
    console.log('---------------------------')
    const toShow = verbose ? uncoveredFamilies : uncoveredFamilies.slice(0, 10)
    for (const family of toShow) {
      console.log(`  ${family.name.padEnd(30)} [${family.category}] ${family.components.length} components`)
      if (verbose) {
        for (const comp of family.components.slice(0, 3)) {
          console.log(`    - ${comp}`)
        }
        if (family.components.length > 3) {
          console.log(`    ... and ${family.components.length - 3} more`)
        }
      }
    }
    if (!verbose && uncoveredFamilies.length > 10) {
      console.log(`  ... and ${uncoveredFamilies.length - 10} more families`)
    }
  }

  if (partialFamilies.length > 0) {
    console.log('\n⚠️  Families With Partial Coverage')
    console.log('-----------------------------------')
    const toShow = verbose ? partialFamilies : partialFamilies.slice(0, 10)
    for (const family of toShow) {
      console.log(
        `  ${family.name.padEnd(30)} [${family.category}] ${family.storyExports} exports, ${family.components.length} components`,
      )
      if (verbose && family.storyFile) {
        console.log(`    Story: ${family.storyFile}`)
        console.log(`    Exports: ${family.storyExportNames.join(', ')}`)
      }
    }
    if (!verbose && partialFamilies.length > 10) {
      console.log(`  ... and ${partialFamilies.length - 10} more families`)
    }
  }

  // Top covered families
  const completeFamilies = report.families.filter((f) => f.coverage === 'complete')
  if (completeFamilies.length > 0 && verbose) {
    console.log('\n✅ Families With Complete Coverage')
    console.log('-----------------------------------')
    for (const family of completeFamilies.slice(0, 10)) {
      console.log(
        `  ${family.name.padEnd(30)} [${family.category}] ${family.storyExports} exports, ${family.components.length} components`,
      )
    }
    if (completeFamilies.length > 10) {
      console.log(`  ... and ${completeFamilies.length - 10} more families`)
    }
  }

  console.log('\n✅ Family inventory complete!')
}

function printTopLevelReport(report: TopLevelCoverageReport, verbose: boolean): void {
  // Summary
  console.log('\n📊 Top-Level Coverage Summary')
  console.log('------------------------------')
  console.log(`Total Groups: ${report.totalGroups}`)
  console.log(`Covered Groups: ${report.coveredGroups}`)
  console.log(`Coverage: ${report.coveragePercent}%`)
  console.log(`Total Story Exports: ${report.totalStoryExports}`)

  // Coverage by category
  console.log('\n📁 Coverage by Category')
  console.log('-----------------------')
  for (const cat of report.byCategory) {
    const bar = createProgressBar(cat.percentage)
    console.log(`${cat.category.padEnd(12)} ${bar} ${cat.covered}/${cat.total} groups (${cat.percentage}%)`)
  }

  // Groups needing coverage
  const uncoveredGroups = report.groups.filter((g) => g.coverage === 'none')
  const partialGroups = report.groups.filter((g) => g.coverage === 'partial')
  const completeGroups = report.groups.filter((g) => g.coverage === 'complete')

  if (uncoveredGroups.length > 0) {
    console.log('\n❌ Groups Without Stories (need ONE story each)')
    console.log('------------------------------------------------')
    const toShow = verbose ? uncoveredGroups : uncoveredGroups.slice(0, 15)
    for (const group of toShow) {
      console.log(
        `  ${group.name.padEnd(25)} [${group.category}] ${group.families.length} families, ${group.totalComponents} components`,
      )
      if (verbose) {
        console.log(`    Path: ${group.rootPath}`)
        console.log(`    Families: ${group.families.map((f) => f.name).join(', ')}`)
      }
    }
    if (!verbose && uncoveredGroups.length > 15) {
      console.log(`  ... and ${uncoveredGroups.length - 15} more groups`)
    }
  }

  if (partialGroups.length > 0) {
    console.log('\n⚠️  Groups With Partial Coverage')
    console.log('---------------------------------')
    const toShow = verbose ? partialGroups : partialGroups.slice(0, 10)
    for (const group of toShow) {
      console.log(
        `  ${group.name.padEnd(25)} [${group.category}] ${group.storyExports} exports, ${group.families.length} families`,
      )
      if (verbose && group.storyPath) {
        console.log(`    Story: ${group.storyPath}`)
      }
    }
    if (!verbose && partialGroups.length > 10) {
      console.log(`  ... and ${partialGroups.length - 10} more groups`)
    }
  }

  if (completeGroups.length > 0 && verbose) {
    console.log('\n✅ Groups With Complete Coverage')
    console.log('---------------------------------')
    for (const group of completeGroups.slice(0, 15)) {
      console.log(
        `  ${group.name.padEnd(25)} [${group.category}] ${group.storyExports} exports, ${group.totalComponents} components`,
      )
    }
    if (completeGroups.length > 15) {
      console.log(`  ... and ${completeGroups.length - 15} more groups`)
    }
  }

  console.log('\n✅ Top-level inventory complete!')
  console.log('\n💡 Tip: Create ONE story for each uncovered group to achieve 100% coverage.')
}

function createProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 5)
  const empty = 20 - filled
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`
}

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1]
  }
  return undefined
}

main().catch((error) => {
  console.error('Error running inventory:', error)
  process.exit(1)
})
