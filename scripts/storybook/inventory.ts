#!/usr/bin/env npx ts-node

/**
 * Component Inventory Script
 *
 * Scans the codebase for React components and generates an inventory
 * with coverage analysis and priority scoring.
 *
 * Usage: npx ts-node scripts/storybook/inventory.ts [--verbose] [--json] [--output <file>]
 */

import * as fs from 'fs'
import * as path from 'path'
import { scanComponents } from './scanner'
import { analyzeStoryCoverage, calculateCoverageStats, getCoverageByCategory } from './coverage'
import { calculatePriorityScores, getTopPriorityComponents, generateWorkOrder } from './priority'
import type { ComponentEntry, CoverageReport } from './types'

interface InventoryOptions {
  verbose: boolean
  json: boolean
  output?: string
}

async function main() {
  const args = process.argv.slice(2)
  const options: InventoryOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    json: args.includes('--json'),
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

  // Generate report
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
