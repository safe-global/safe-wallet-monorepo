// Scores reviewers against two benchmarks and writes results/score.json.
// 1. Human benchmark: issues humans raised (E) or acted on after the Claude bot raised them (C only), that already
//    existed at the review SHA. Recall = share of those issues a reviewer also raised.
// 2. Findings benchmark: what each reviewer produced and how much of it the blind judge found valid. No pooled recall.
// Usage: node eval/judge/score.js
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const read = (...p) => JSON.parse(fs.readFileSync(path.join(root, ...p), 'utf8'))
const valid = (l) => l === 'medium' || l === 'low'
const prs = read('prs.json').filter((p) => fs.existsSync(path.join(root, 'results', String(p.pr), 'humans.json')))
const bots = ['A', 'B', 'C', 'D'].filter((s) => prs.some((p) => fs.existsSync(path.join(root, 'runs', String(p.pr), `${s}.json`))))
const ran = (s, p) => fs.existsSync(path.join(root, 'runs', String(p.pr), `${s}.json`))

const rows = prs.flatMap((p) => {
  const key = read('results', String(p.pr), 'key.json')
  const verdicts = Object.fromEntries(read('results', String(p.pr), 'humans.json').verdicts.map((v) => [v.issue, v]))
  return read('results', String(p.pr), 'issues.json').issues.map((x, i) => ({
    pr: p, label: x.label, category: x.category, summary: x.summary, by: new Set(x.findings.map((f) => key[f].sys)), human: verdicts[i],
  }))
})

// Benchmark sets.
const humanRaised = rows.filter((r) => r.by.has('E'))
const reachable = (r) => r.human?.present
const strictE = humanRaised.filter((r) => reachable(r) && r.human.verdict === 'accepted')
const broadE = humanRaised.filter((r) => reachable(r) && r.human.verdict !== 'rejected')
const endorsedC = rows.filter((r) => !r.by.has('E') && r.by.has('C') && reachable(r) && r.human.verdict === 'accepted')

const recall = (set, s) => {
  const elig = set.filter((r) => ran(s, r.pr))
  const hit = elig.filter((r) => r.by.has(s)).length
  return { n: elig.length, hit, rate: elig.length ? hit / elig.length : null }
}
const cPrs = (set) => set.filter((r) => r.pr.hasC)
const human = {
  counts: {
    prsWithHumanComments: new Set(humanRaised.map((r) => r.pr.pr)).size,
    humanIssues: humanRaised.length,
    notAtReviewSha: humanRaised.filter((r) => r.human && !r.human.present).length,
    accepted: humanRaised.filter((r) => r.human?.verdict === 'accepted').length,
    rejected: humanRaised.filter((r) => r.human?.verdict === 'rejected').length,
    open: humanRaised.filter((r) => r.human?.verdict === 'open').length,
    strict: strictE.length,
    broad: broadE.length,
    cOnlyIssues: rows.filter((r) => !r.by.has('E') && r.by.has('C') && r.by.size === 1).length,
    cOnlyAccepted: endorsedC.length,
  },
  strict: Object.fromEntries(bots.map((s) => [s, recall(strictE, s)])),
  broad: Object.fromEntries(bots.map((s) => [s, recall(broadE, s)])),
  // On PRs where C ran, the key also holds issues humans only acted on after C raised them.
  withC: Object.fromEntries(bots.map((s) => [s, recall([...cPrs(strictE), ...endorsedC], s)])),
  withCHumanOnly: Object.fromEntries(bots.map((s) => [s, recall(cPrs(strictE), s)])),
}

const findings = Object.fromEntries(['A', 'B', 'C', 'D', 'E'].filter((s) => s === 'E' || bots.includes(s)).map((s) => {
  const ps = prs.filter((p) => ran(s, p))
  const mine = rows.filter((r) => r.by.has(s))
  const n = ps.reduce((a, p) => {
    const f = path.join(root, 'results', String(p.pr), 'findings', `${s}.json`)
    return a + (fs.existsSync(f) ? read('results', String(p.pr), 'findings', `${s}.json`).findings.length : 0)
  }, 0)
  const usd = ['A', 'B'].includes(s) ? ps.reduce((a, p) => a + read('runs', String(p.pr), `${s}.json`).usage.apiEquivalentUsd, 0) : null
  const share = (f) => (mine.length ? mine.filter(f).length / mine.length : null)
  return [s, {
    prs: ps.length, findings: n, issues: mine.length, issuesPerPr: mine.length / ps.length,
    validIssues: mine.filter((r) => valid(r.label)).length, validPerPr: mine.filter((r) => valid(r.label)).length / ps.length,
    medium: mine.filter((r) => r.label === 'medium').length,
    validShare: share((r) => valid(r.label)), nitShare: share((r) => r.label === 'nit'), wrongShare: share((r) => r.label === 'wrong'),
    usdPerPr: usd === null ? null : usd / ps.length,
  }]
}))

// Combinations: an issue counts for a combo if any member raised it. Combos with C or D use only the PRs where those ran.
const subsets = (xs) => xs.reduce((acc, x) => [...acc, ...acc.map((a) => [...a, x])], [[]]).filter((a) => a.length > 1)
const combos = Object.fromEntries(subsets(bots).map((combo) => {
  const elig = (p) => combo.every((s) => ran(s, p))
  const key = strictE.filter((r) => elig(r.pr))
  const mine = rows.filter((r) => elig(r.pr) && combo.some((s) => r.by.has(s)))
  const ps = prs.filter(elig)
  return [combo.join('+'), {
    prs: ps.length,
    human: { n: key.length, hit: key.filter((r) => combo.some((s) => r.by.has(s))).length },
    issues: mine.length, validIssues: mine.filter((r) => valid(r.label)).length,
    validShare: mine.length ? mine.filter((r) => valid(r.label)).length / mine.length : null,
    validPerPr: mine.filter((r) => valid(r.label)).length / ps.length,
  }]
}))

const out = { prs: prs.length, human, findings, combos }
fs.writeFileSync(path.join(root, 'results', 'score.json'), JSON.stringify(out, null, 2) + '\n')
const pct = (x) => (x === null ? '–' : `${Math.round(x * 100)}%`)
console.log(JSON.stringify(human.counts))
for (const k of ['strict', 'broad', 'withC', 'withCHumanOnly']) console.log(k, Object.entries(human[k]).map(([s, v]) => `${s} ${v.hit}/${v.n} ${pct(v.rate)}`).join(' | '))
for (const [s, v] of Object.entries(findings)) console.log(s, `prs ${v.prs} findings ${v.findings} issues ${v.issues} (${v.issuesPerPr.toFixed(1)}/PR) valid ${v.validIssues} (${v.validPerPr.toFixed(1)}/PR, ${pct(v.validShare)}) medium ${v.medium} nit ${pct(v.nitShare)} wrong ${pct(v.wrongShare)} $/PR ${v.usdPerPr?.toFixed(2) ?? '–'}`)
for (const [k, v] of Object.entries(combos)) console.log(k, `prs ${v.prs} human ${v.human.hit}/${v.human.n} ${pct(v.human.n ? v.human.hit / v.human.n : null)} | issues ${v.issues} valid ${v.validIssues} (${v.validPerPr.toFixed(1)}/PR, ${pct(v.validShare)})`)
