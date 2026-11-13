// Merges the `jest --json --coverage` reports of sharded runs into one report.
// Usage: node merge-jest-reports.mjs <dir with one subfolder per shard> <output file> [--check-thresholds]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const require = createRequire(join(process.cwd(), 'package.json'))
const { createCoverageMap } = require('istanbul-lib-coverage')

const [dir, output] = process.argv.slice(2)
const reports = existsSync(dir)
  ? readdirSync(dir)
      .map((shard) => join(dir, shard, 'report.json'))
      .filter(existsSync)
      .map((file) => JSON.parse(readFileSync(file, 'utf8')))
  : []

if (reports.length === 0) {
  console.log(`No reports found in ${dir}`)
  process.exit(0)
}

const coverage = createCoverageMap({})
const merged = { ...reports[0], success: true, testResults: [] }
const counters = Object.keys(merged).filter((key) => key.startsWith('num'))
counters.forEach((key) => (merged[key] = 0))

for (const report of reports) {
  counters.forEach((key) => (merged[key] += report[key]))
  merged.success &&= report.success
  merged.startTime = Math.min(merged.startTime, report.startTime)
  merged.testResults.push(...report.testResults)
  coverage.merge(report.coverageMap ?? {})
}

merged.coverageMap = coverage.toJSON()
writeFileSync(output, JSON.stringify(merged))

if (process.argv.includes('--check-thresholds')) {
  const { coverageThreshold } = await require('./jest.config.cjs')()
  const summary = coverage.getCoverageSummary()
  const failures = Object.entries(coverageThreshold.global).filter(([metric, min]) => summary[metric].pct < min)
  failures.forEach(([metric, min]) =>
    console.error(`Coverage for ${metric} (${summary[metric].pct}%) is below ${min}%`),
  )
  process.exit(failures.length > 0 ? 1 : 0)
}
