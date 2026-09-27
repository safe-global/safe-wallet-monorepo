// Scores each reviewer and combination against the judged issues. Writes results/summary.json and prints tables.
// Usage: node eval/judge/metrics.js
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const weight = { high: 3, medium: 2, low: 1 }
const real = (x) => x.label in weight
const prs = require(path.join(root, 'prs.json')).filter((p) => fs.existsSync(path.join(root, 'results', String(p.pr), 'issues.json')))
const light = (pr) => /unscored|No paired adjudication|instead of starting/i.test(require(path.join(root, 'runs', String(pr), 'B.json')).output)

// One row per issue: which systems raised it.
const rows = prs.flatMap((p) => {
  const key = require(path.join(root, 'results', String(p.pr), 'key.json'))
  return require(path.join(root, 'results', String(p.pr), 'issues.json')).issues.map((x) => ({
    pr: p.pr, band: p.band, hasC: p.hasC, label: x.label, summary: x.summary, by: new Set(x.findings.map((f) => key[f].sys)),
  }))
})
const cost = (sys, pr) => (['A', 'B'].includes(sys) ? require(path.join(root, 'runs', String(pr), `${sys}.json`)).usage.apiEquivalentUsd : 0)

const score = (combo, subset) => {
  const ids = new Set(subset.map((p) => p.pr))
  const pool = rows.filter((r) => ids.has(r.pr))
  const key = pool.filter(real)
  const raised = pool.filter((r) => combo.some((s) => r.by.has(s)))
  const found = raised.filter(real)
  const w = (xs) => xs.reduce((a, r) => a + weight[r.label], 0)
  const serious = (xs) => xs.filter((r) => ['high', 'medium'].includes(r.label)).length
  return {
    prs: subset.length,
    raised: raised.length,
    real: found.length,
    recall: found.length / key.length,
    weightedRecall: w(found) / w(key),
    seriousRecall: serious(found) / serious(key),
    precision: found.length / raised.length,
    wrong: raised.filter((r) => r.label === 'wrong').length / raised.length,
    nit: raised.filter((r) => r.label === 'nit').length / raised.length,
    unique: combo.length === 1 ? found.filter((r) => r.by.size === 1).length : undefined,
    usd: subset.reduce((a, p) => a + combo.reduce((b, s) => b + cost(s, p.pr), 0), 0),
  }
}

const combos = (systems) => systems.flatMap((_, i) => systems.slice(i).map((s, j) => systems.slice(i, i + j + 1)))
const subsets = (xs) => xs.reduce((acc, x) => [...acc, ...acc.map((a) => [...a, x])], [[]]).filter((a) => a.length)
const withC = prs.filter((p) => p.hasC)
const summary = {
  judged: prs.length,
  issues: rows.length,
  labels: Object.fromEntries(['high', 'medium', 'low', 'nit', 'wrong', 'unverifiable'].map((l) => [l, rows.filter((r) => r.label === l).length])),
  all: Object.fromEntries(subsets(['A', 'B', 'E']).map((c) => [c.join('+'), score(c, prs)])),
  withC: Object.fromEntries(subsets(['A', 'B', 'C', 'E']).map((c) => [c.join('+'), score(c, withC)])),
  byBand: Object.fromEntries(['S', 'M', 'L'].map((b) => [b, Object.fromEntries(['A', 'B', 'E'].map((s) => [s, score([s], prs.filter((p) => p.band === b))]))])),
  bMode: { full: score(['B'], prs.filter((p) => !light(p.pr))), light: score(['B'], prs.filter((p) => light(p.pr))) },
}
fs.writeFileSync(path.join(root, 'results', 'summary.json'), JSON.stringify(summary, null, 2) + '\n')

const pct = (x) => (x === undefined || Number.isNaN(x) ? '–' : `${Math.round(x * 100)}%`)
const table = (title, obj) => {
  console.log(`\n${title}\n| | PRs | raised | real | recall | wtd recall | high+med recall | precision | wrong | nit | unique | $ |\n|---|---|---|---|---|---|---|---|---|---|---|---|`)
  for (const [k, v] of Object.entries(obj)) console.log(`| ${k} | ${v.prs} | ${v.raised} | ${v.real} | ${pct(v.recall)} | ${pct(v.weightedRecall)} | ${pct(v.seriousRecall)} | ${pct(v.precision)} | ${pct(v.wrong)} | ${pct(v.nit)} | ${v.unique ?? '–'} | ${v.usd.toFixed(0)} |`)
}
console.log(`judged ${summary.judged} PRs, ${summary.issues} issues`, summary.labels)
table('All PRs (A, B, E)', summary.all)
table('PRs where C ran', summary.withC)
for (const [b, v] of Object.entries(summary.byBand)) table(`Band ${b}`, v)
table('B full vs light', summary.bMode)
