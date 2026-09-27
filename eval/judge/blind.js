// Pools each PR's findings under shuffled ids: results/<pr>/blind.json (for the judge) and key.json (id -> source).
// Also stores the PR title and description in blind.json so the judge can tell intended behaviour from bugs.
// Usage: node eval/judge/blind.js   (needs gh)
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

for (const p of require(path.join(root, 'prs.json'))) {
  const dir = path.join(root, 'results', String(p.pr))
  const systems = ['A', 'B', ...(p.hasC ? ['C'] : []), 'E']
  if (fs.existsSync(path.join(dir, 'blind.json'))) continue
  if (!systems.every((sys) => fs.existsSync(path.join(dir, 'findings', `${sys}.json`)))) continue
  const all = systems.flatMap((sys) => {
    const f = path.join(dir, 'findings', `${sys}.json`)
    return fs.existsSync(f) ? require(f).findings.map((x, i) => ({ ...x, sys, i })) : []
  })
  // Seeded shuffle so ids are stable across reruns.
  let seed = p.pr
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
  const shuffled = all.map((x) => [rnd(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x)
  const pr = JSON.parse(execSync(`gh pr view ${p.pr} --repo safe-global/safe-wallet-monorepo --json title,body`, { encoding: 'utf8' }))
  const findings = shuffled.map((x, n) => ({ id: `F${n + 1}`, file: x.file, line: x.line, claim: x.claim }))
  const key = Object.fromEntries(shuffled.map((x, n) => [`F${n + 1}`, { sys: x.sys, i: x.i }]))
  fs.writeFileSync(path.join(dir, 'blind.json'), JSON.stringify({ pr: p.pr, title: pr.title, description: (pr.body ?? '').slice(0, 6000), findings }, null, 2) + '\n')
  fs.writeFileSync(path.join(dir, 'key.json'), JSON.stringify(key, null, 2) + '\n')
  process.stderr.write('.')
}
