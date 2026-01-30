#!/usr/bin/env npx tsx

/**
 * Dependency Audit Script
 *
 * Analyzes component dependencies to identify what MSW fixtures/handlers are needed.
 * Outputs a report of hooks, API calls, and fixture coverage gaps.
 *
 * Usage: npx tsx scripts/storybook/dependency-audit.ts [--json]
 */

import { scanComponents } from './scanner'
import { calculatePriorityScores } from './priority'
import { analyzeStoryCoverage } from './coverage'
import type { ComponentEntry } from './types'

interface DependencyReport {
  timestamp: string
  summary: {
    totalComponents: number
    uncoveredComponents: number
    needsMsw: number
    needsRedux: number
    needsWeb3: number
  }
  hookUsage: Record<string, number>
  reduxUsage: Record<string, number>
  packageUsage: Record<string, number>
  fixtureGaps: {
    endpoint: string
    usedBy: string[]
    priority: 'high' | 'medium' | 'low'
  }[]
  recommendations: string[]
}

async function main() {
  const args = process.argv.slice(2)
  const jsonOutput = args.includes('--json')

  if (!jsonOutput) {
    console.log('🔍 Dependency Audit')
    console.log('===================\n')
  }

  // Scan and analyze components
  let components = await scanComponents({ verbose: false })
  components = calculatePriorityScores(components)
  components = analyzeStoryCoverage(components)

  const uncovered = components.filter((c) => !c.hasStory)

  // Aggregate dependency data
  const hookUsage: Record<string, number> = {}
  const reduxUsage: Record<string, number> = {}
  const packageUsage: Record<string, number> = {}

  for (const comp of uncovered) {
    for (const hook of comp.dependencies.hooks) {
      hookUsage[hook] = (hookUsage[hook] || 0) + 1
    }
    for (const redux of comp.dependencies.redux) {
      reduxUsage[redux] = (reduxUsage[redux] || 0) + 1
    }
    for (const pkg of comp.dependencies.packages) {
      packageUsage[pkg] = (packageUsage[pkg] || 0) + 1
    }
  }

  // Count components by dependency type
  const needsMsw = uncovered.filter((c) => c.dependencies.needsMsw).length
  const needsRedux = uncovered.filter((c) => c.dependencies.needsRedux).length
  const needsWeb3 = uncovered.filter((c) => c.dependencies.needsWeb3).length

  // Identify fixture gaps based on hook patterns
  const fixtureGaps = identifyFixtureGaps(hookUsage, uncovered)

  // Generate recommendations
  const recommendations = generateRecommendations(fixtureGaps, needsWeb3, needsRedux)

  const report: DependencyReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: components.length,
      uncoveredComponents: uncovered.length,
      needsMsw,
      needsRedux,
      needsWeb3,
    },
    hookUsage,
    reduxUsage,
    packageUsage,
    fixtureGaps,
    recommendations,
  }

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printReport(report)
  }
}

function identifyFixtureGaps(
  hookUsage: Record<string, number>,
  uncovered: ComponentEntry[],
): DependencyReport['fixtureGaps'] {
  const gaps: DependencyReport['fixtureGaps'] = []

  // Known hooks that need specific fixtures
  const hookToEndpoint: Record<string, string> = {
    useSafeApps: '/v1/safe-apps',
    useSafeAppsList: '/v1/safe-apps',
    useTransactionType: '/v1/chains/:chainId/transactions',
    useTxHistory: '/v1/chains/:chainId/safes/:address/transactions/history',
    useTxQueue: '/v1/chains/:chainId/safes/:address/transactions/queued',
    useNotifications: '/v1/notifications',
    useAddressBook: 'localStorage (addressBook)',
    useChains: '/v1/chains',
    useSafeInfo: '/v1/chains/:chainId/safes/:address',
    useBalances: '/v1/chains/:chainId/safes/:address/balances',
    useCollectibles: '/v2/chains/:chainId/safes/:address/collectibles',
  }

  // Existing fixture coverage
  const coveredEndpoints = new Set([
    '/v1/chains',
    '/v1/chains/:chainId',
    '/v1/chains/:chainId/safes/:address',
    '/v1/chains/:chainId/safes/:address/balances',
    '/v1/chains/:chainId/safes/:address/positions',
    '/v1/portfolio/:address',
  ])

  for (const [hook, count] of Object.entries(hookUsage)) {
    const endpoint = hookToEndpoint[hook]
    if (endpoint && !coveredEndpoints.has(endpoint)) {
      const usedBy = uncovered.filter((c) => c.dependencies.hooks.includes(hook)).map((c) => c.name)

      gaps.push({
        endpoint,
        usedBy: usedBy.slice(0, 5), // Top 5 components using this
        priority: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
      })
    }
  }

  // Sort by priority and count
  return gaps.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

function generateRecommendations(
  gaps: DependencyReport['fixtureGaps'],
  needsWeb3: number,
  needsRedux: number,
): string[] {
  const recs: string[] = []

  // High priority gaps
  const highPriority = gaps.filter((g) => g.priority === 'high')
  if (highPriority.length > 0) {
    recs.push(
      `Add fixtures for ${highPriority.length} high-priority endpoints: ${highPriority.map((g) => g.endpoint).join(', ')}`,
    )
  }

  // Web3 components
  if (needsWeb3 > 0) {
    recs.push(`${needsWeb3} components need Web3 mocking - ensure MockWeb3Provider decorator is available`)
  }

  // Redux components
  if (needsRedux > 0) {
    recs.push(`${needsRedux} components use Redux - ensure StoreDecorator provides necessary slices`)
  }

  // Transaction fixtures
  if (gaps.some((g) => g.endpoint.includes('transactions'))) {
    recs.push('Add transaction fixtures (history, queue, details) to config/test/msw/fixtures/transactions/')
  }

  // Safe Apps fixtures
  if (gaps.some((g) => g.endpoint.includes('safe-apps'))) {
    recs.push('Add Safe Apps fixtures to config/test/msw/fixtures/safe-apps/')
  }

  return recs
}

function printReport(report: DependencyReport): void {
  console.log('📊 Summary')
  console.log('----------')
  console.log(`Total Components: ${report.summary.totalComponents}`)
  console.log(`Uncovered: ${report.summary.uncoveredComponents}`)
  console.log(`Need MSW: ${report.summary.needsMsw}`)
  console.log(`Need Redux: ${report.summary.needsRedux}`)
  console.log(`Need Web3: ${report.summary.needsWeb3}`)

  console.log('\n🪝 Most Used Hooks (in uncovered components)')
  console.log('---------------------------------------------')
  const sortedHooks = Object.entries(report.hookUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
  for (const [hook, count] of sortedHooks) {
    console.log(`  ${hook}: ${count}`)
  }

  if (report.fixtureGaps.length > 0) {
    console.log('\n⚠️  Fixture Gaps (endpoints not yet covered)')
    console.log('--------------------------------------------')
    for (const gap of report.fixtureGaps) {
      const priority = gap.priority === 'high' ? '🔴' : gap.priority === 'medium' ? '🟡' : '🟢'
      console.log(`  ${priority} ${gap.endpoint}`)
      console.log(`     Used by: ${gap.usedBy.join(', ')}${gap.usedBy.length < 5 ? '' : '...'}`)
    }
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations')
    console.log('------------------')
    for (const rec of report.recommendations) {
      console.log(`  • ${rec}`)
    }
  }

  console.log('\n✅ Audit complete!')
}

main().catch((error) => {
  console.error('Error running dependency audit:', error)
  process.exit(1)
})
