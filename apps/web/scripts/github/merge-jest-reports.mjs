#!/usr/bin/env node
// Merges the `jest --json --coverage` reports of several `--shard` runs into one report.json and
// coverage/lcov.info in <output-dir>. With --check-threshold it also applies the global
// coverageThreshold from jest.config.cjs to the merged coverage, because each shard runs with
// the threshold turned off: a single shard only covers part of the code.
//
// Usage: node merge-jest-reports.mjs [--check-threshold] <output-dir> <report.json>...
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import libCoverage from 'istanbul-lib-coverage'
import libReport from 'istanbul-lib-report'
import reports from 'istanbul-reports'

const COUNTERS = [
  'numFailedTestSuites',
  'numFailedTests',
  'numPassedTestSuites',
  'numPassedTests',
  'numPendingTestSuites',
  'numPendingTests',
  'numRuntimeErrorTestSuites',
  'numTodoTests',
  'numTotalTestSuites',
  'numTotalTests',
]

const args = process.argv.slice(2)
const checkThreshold = args[0] === '--check-threshold'
const [outputDir, ...inputs] = checkThreshold ? args.slice(1) : args

if (!outputDir || inputs.length === 0) {
  console.error('Usage: node merge-jest-reports.mjs [--check-threshold] <output-dir> <report.json>...')
  process.exit(1)
}

const addHits = (a, b) => Object.fromEntries(Object.entries(a).map(([id, hits]) => [id, hits + b[id]]))
const addBranchHits = (a, b) =>
  Object.fromEntries(Object.entries(a).map(([id, hits]) => [id, hits.map((count, i) => count + b[id][i])]))
const sameInstrumentation = (a, b) =>
  JSON.stringify([a.statementMap, a.fnMap, a.branchMap]) === JSON.stringify([b.statementMap, b.fnMap, b.branchMap])

// istanbul-lib-coverage's merge keeps only one of several functions that share a source location,
// which lowers the function total. When both shards instrumented a file the same way, add the hit counts by id instead.
const mergeFileCoverage = (a, b) => {
  if (sameInstrumentation(a, b)) {
    return { ...a, s: addHits(a.s, b.s), f: addHits(a.f, b.f), b: addBranchHits(a.b, b.b) }
  }
  const fileCoverage = libCoverage.createFileCoverage(a)
  fileCoverage.merge(b)
  return fileCoverage.toJSON()
}

const shards = inputs.map((file) => JSON.parse(readFileSync(file, 'utf8')))
const mergedFiles = {}
shards.forEach((shard) => {
  Object.values(shard.coverageMap ?? {}).forEach((entry) => {
    const file = entry.data ?? entry
    mergedFiles[file.path] = mergedFiles[file.path] ? mergeFileCoverage(mergedFiles[file.path], file) : file
  })
})
const coverageMap = libCoverage.createCoverageMap(mergedFiles)

const merged = {
  ...shards[0],
  ...Object.fromEntries(COUNTERS.map((key) => [key, shards.reduce((sum, shard) => sum + (shard[key] ?? 0), 0)])),
  startTime: Math.min(...shards.map((shard) => shard.startTime)),
  success: shards.every((shard) => shard.success),
  wasInterrupted: shards.some((shard) => shard.wasInterrupted),
  testResults: shards.flatMap((shard) => shard.testResults ?? []),
  coverageMap: coverageMap.toJSON(),
}

mkdirSync(outputDir, { recursive: true })
writeFileSync(join(outputDir, 'report.json'), JSON.stringify(merged))

const context = libReport.createContext({ dir: join(outputDir, 'coverage'), coverageMap })
reports.create('lcovonly').execute(context)

console.log(`Merged ${inputs.length} reports: ${merged.numTotalTestSuites} suites, ${merged.numTotalTests} tests`)

if (checkThreshold) {
  const require = createRequire(import.meta.url)
  const jestConfig = await require('../../jest.config.cjs')()
  const threshold = jestConfig.coverageThreshold?.global ?? {}
  const summary = coverageMap.getCoverageSummary()
  let failed = false

  // Same rule as Jest: a positive value is a minimum percentage, a negative one the most uncovered entities allowed
  for (const [metric, limit] of Object.entries(threshold)) {
    const { pct, total, covered } = summary[metric]
    const uncovered = total - covered
    const ok = limit >= 0 ? pct >= limit : uncovered <= -limit
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} ${metric}: ${limit >= 0 ? `${pct}% (min ${limit}%)` : `${uncovered} uncovered (max ${-limit})`}`,
    )
    failed ||= !ok
  }

  if (failed) {
    console.error('Coverage threshold not met')
    process.exit(1)
  }
}
