#!/usr/bin/env npx ts-node

/**
 * Coverage Report Generator
 *
 * Generates detailed coverage reports in various formats.
 *
 * Usage: npx ts-node scripts/storybook/coverage-report.ts [--format html|json|md] [--output <file>]
 */

import * as fs from 'fs'
import { scanComponents } from './scanner'
import { analyzeStoryCoverage, calculateCoverageStats, getCoverageByCategory, getUncoveredComponents } from './coverage'
import { calculatePriorityScores, groupByPriorityTier, generateWorkOrder } from './priority'
import { groupByMockingRequirements, findCriticalDependencies } from './dependencies'
import type { ComponentEntry } from './types'

type ReportFormat = 'json' | 'md' | 'html'

interface ReportOptions {
  format: ReportFormat
  output?: string
}

async function main() {
  const args = process.argv.slice(2)
  const options: ReportOptions = {
    format: (getArgValue(args, '--format') as ReportFormat) || 'md',
    output: getArgValue(args, '--output') || getArgValue(args, '-o'),
  }

  console.log('📈 Coverage Report Generator')
  console.log('============================\n')

  // Scan and analyze
  let components = await scanComponents()
  components = calculatePriorityScores(components)
  components = analyzeStoryCoverage(components)

  // Generate report in requested format
  let report: string

  switch (options.format) {
    case 'json':
      report = generateJsonReport(components)
      break
    case 'html':
      report = generateHtmlReport(components)
      break
    case 'md':
    default:
      report = generateMarkdownReport(components)
  }

  if (options.output) {
    fs.writeFileSync(options.output, report)
    console.log(`Report saved to ${options.output}`)
  } else {
    console.log(report)
  }
}

function generateJsonReport(components: ComponentEntry[]): string {
  const stats = calculateCoverageStats(components)
  const byCategory = getCoverageByCategory(components)
  const priorityTiers = groupByPriorityTier(components)
  const mockingGroups = groupByMockingRequirements(components)
  const criticalDeps = findCriticalDependencies(components)

  return JSON.stringify(
    {
      generated: new Date().toISOString(),
      summary: stats,
      byCategory,
      priorityTiers: Object.fromEntries(
        Array.from(priorityTiers.entries()).map(([tier, comps]) => [tier, comps.map((c) => c.name)]),
      ),
      mockingRequirements: Object.fromEntries(
        Array.from(mockingGroups.entries()).map(([req, comps]) => [req, comps.map((c) => c.name)]),
      ),
      criticalDependencies: criticalDeps.map((c) => c.name),
      uncovered: getUncoveredComponents(components).map((c) => ({
        name: c.name,
        category: c.category,
        priorityScore: c.priorityScore,
        path: c.path,
      })),
    },
    null,
    2,
  )
}

function generateMarkdownReport(components: ComponentEntry[]): string {
  const stats = calculateCoverageStats(components)
  const byCategory = getCoverageByCategory(components)
  const workOrder = generateWorkOrder(components)
  const uncovered = getUncoveredComponents(components)

  let md = `# Storybook Coverage Report

Generated: ${new Date().toISOString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Components | ${stats.total} |
| With Stories | ${stats.withStories} |
| Coverage | ${stats.percentage}% |
| Complete Stories | ${stats.complete} |
| Incomplete Stories | ${stats.incomplete} |

## Coverage by Category

| Category | Coverage | Stories | Total |
|----------|----------|---------|-------|
`

  for (const cat of byCategory) {
    md += `| ${cat.category} | ${cat.percentage}% | ${cat.withStories} | ${cat.total} |\n`
  }

  md += `
## Work Order

The following phases are recommended for creating stories:

`

  for (const phase of workOrder) {
    md += `### ${phase.phase}

**Effort:** ${phase.estimatedEffort}
**Components:** ${phase.components.length}
**Rationale:** ${phase.rationale}

Components:
`
    for (const comp of phase.components.slice(0, 10)) {
      md += `- \`${comp.name}\` (${comp.category}) - Score: ${comp.priorityScore}\n`
    }
    if (phase.components.length > 10) {
      md += `- ... and ${phase.components.length - 10} more\n`
    }
    md += '\n'
  }

  md += `## Top 20 Priority Components

| Component | Category | Score | Reasons |
|-----------|----------|-------|---------|
`

  for (const comp of uncovered.slice(0, 20)) {
    md += `| ${comp.name} | ${comp.category} | ${comp.priorityScore} | ${comp.priorityReasons.join(', ')} |\n`
  }

  return md
}

function generateHtmlReport(components: ComponentEntry[]): string {
  const stats = calculateCoverageStats(components)
  const byCategory = getCoverageByCategory(components)
  const uncovered = getUncoveredComponents(components)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Storybook Coverage Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
    h1 { color: #1a1a1a; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .metric { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 36px; font-weight: bold; color: #0070f3; }
    .metric-label { color: #666; margin-top: 5px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #f5f5f5; }
    .progress { background: #e0e0e0; border-radius: 4px; height: 20px; overflow: hidden; }
    .progress-bar { background: #0070f3; height: 100%; }
    .low { background: #ff4444; }
    .medium { background: #ffaa00; }
    .high { background: #00aa00; }
  </style>
</head>
<body>
  <h1>📊 Storybook Coverage Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <div class="summary">
    <div class="metric">
      <div class="metric-value">${stats.total}</div>
      <div class="metric-label">Total Components</div>
    </div>
    <div class="metric">
      <div class="metric-value">${stats.withStories}</div>
      <div class="metric-label">With Stories</div>
    </div>
    <div class="metric">
      <div class="metric-value">${stats.percentage}%</div>
      <div class="metric-label">Coverage</div>
    </div>
  </div>

  <h2>Coverage by Category</h2>
  <table>
    <tr><th>Category</th><th>Progress</th><th>Coverage</th></tr>
    ${byCategory
      .map(
        (cat) => `
    <tr>
      <td>${cat.category}</td>
      <td><div class="progress"><div class="progress-bar ${cat.percentage > 50 ? 'high' : cat.percentage > 25 ? 'medium' : 'low'}" style="width: ${cat.percentage}%"></div></div></td>
      <td>${cat.withStories}/${cat.total} (${cat.percentage}%)</td>
    </tr>
    `,
      )
      .join('')}
  </table>

  <h2>Priority Components (Need Stories)</h2>
  <table>
    <tr><th>Component</th><th>Category</th><th>Priority Score</th></tr>
    ${uncovered
      .slice(0, 30)
      .map(
        (comp) => `
    <tr>
      <td><code>${comp.name}</code></td>
      <td>${comp.category}</td>
      <td>${comp.priorityScore}</td>
    </tr>
    `,
      )
      .join('')}
  </table>
</body>
</html>`
}

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1]
  }
  return undefined
}

main().catch((error) => {
  console.error('Error generating report:', error)
  process.exit(1)
})
