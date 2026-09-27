// Extracts neutral findings from each review: results/<pr>/findings/<system>.json.
// Usage: node eval/judge/extract.js [pr...]   (skips existing files; env CLAUDE_BIN, JOBS)
const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const claude = process.env.CLAUDE_BIN || 'claude'
const jobs = Number(process.env.JOBS || 4)
const schema = JSON.stringify({
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: { file: { type: ['string', 'null'] }, line: { type: ['integer', 'null'] }, claim: { type: 'string' } },
        required: ['file', 'line', 'claim'],
      },
    },
  },
  required: ['findings'],
})
const prompt = `Below is one reviewer's review of a pull request. Extract every distinct finding: a specific problem, risk or requested change about the PR's code, tests, docs or description.

Skip praise, summaries, verdicts, scores, checks that passed, items the reviewer ruled out, and notes about how the review itself was run. Keep items the reviewer marks as uncertain or minor if they still raise them.

For each finding give the main file path and line (null if none), and a claim: one or two plain sentences stating the problem and why it matters. Write every claim in the same neutral voice: no severity, priority or confidence labels, no rule ids, no reviewer names, no markdown, and no reference to the review or its format. If there are no findings, return an empty list.

REVIEW:
`

const run = (pr, sys) =>
  new Promise((resolve) => {
    const out = path.join(root, 'results', String(pr), 'findings', `${sys}.json`)
    const review = require(path.join(root, 'runs', String(pr), `${sys}.json`)).output
    fs.mkdirSync(path.dirname(out), { recursive: true })
    if (review.trim().length < 20) {
      fs.writeFileSync(out, JSON.stringify({ findings: [] }, null, 2) + '\n')
      return resolve()
    }
    const args = ['-p', prompt + review, '--model', 'sonnet', '--tools', '', '--json-schema', schema, '--output-format', 'json', '--no-session-persistence', '--disable-slash-commands']
    execFile(claude, args, { maxBuffer: 1 << 26, cwd: '/tmp' }, (err, stdout) => {
      try {
        if (err) throw err
        const r = JSON.parse(stdout)
        const data = r.structured_output ?? JSON.parse(r.result)
        fs.writeFileSync(out, JSON.stringify({ usd: r.total_cost_usd, findings: data.findings }, null, 2) + '\n')
        console.log(`ok ${pr} ${sys} ${data.findings.length}`)
      } catch (e) {
        console.log(`FAILED ${pr} ${sys}: ${String(e.message).slice(0, 200)}`)
      }
      resolve()
    })
  })

const only = process.argv.slice(2).map(Number)
const tasks = require(path.join(root, 'prs.json'))
  .filter((p) => !only.length || only.includes(p.pr))
  .flatMap((p) => ['A', 'B', 'C', 'E'].map((sys) => [p.pr, sys]))
  .filter(([pr, sys]) => fs.existsSync(path.join(root, 'runs', String(pr), `${sys}.json`)))
  .filter(([pr, sys]) => !fs.existsSync(path.join(root, 'results', String(pr), 'findings', `${sys}.json`)))

;(async () => {
  const queue = [...tasks]
  await Promise.all(Array.from({ length: jobs }, async () => { while (queue.length) await run(...queue.shift()) }))
})()
