// Tags each judged issue with a category (source-blind): adds `category` to results/<pr>/issues.json.
// Usage: node eval/judge/classify.js   (env CLAUDE_BIN, JOBS; skips PRs already tagged)
const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const claude = process.env.CLAUDE_BIN || 'claude'
const jobs = Number(process.env.JOBS || 4)
const categories = ['correctness', 'tests', 'convention', 'style', 'design', 'docs', 'product', 'security', 'performance']
const schema = JSON.stringify({
  type: 'object',
  properties: { categories: { type: 'array', items: { enum: categories } } },
  required: ['categories'],
})
const prompt = `Tag each code-review issue below with exactly one category:
- correctness: logic bugs, wrong behaviour, edge cases, regressions, type errors
- tests: missing, weak or wrong tests
- convention: violates a repo rule or established pattern (file placement, imports, reuse of existing components or helpers, typing rules such as no casts, mocking rules, architecture boundaries)
- style: naming, readability, formatting or code-shape preferences
- design: duplication, abstraction, structure, maintainability
- docs: comments, docs, PR description
- product: UX copy, analytics events, visible product behaviour or scope decisions
- security, performance
Return one category per issue, in the same order.

ISSUES:
`

const run = (pr) =>
  new Promise((resolve) => {
    const file = path.join(root, 'results', String(pr), 'issues.json')
    const data = require(file)
    const list = data.issues.map((x, i) => `${i + 1}. ${x.summary}`).join('\n')
    const args = ['-p', prompt + list, '--model', 'sonnet', '--tools', '', '--json-schema', schema, '--output-format', 'json', '--no-session-persistence', '--disable-slash-commands']
    execFile(claude, args, { maxBuffer: 1 << 26, cwd: '/tmp' }, (err, stdout) => {
      try {
        if (err) throw err
        const r = JSON.parse(stdout)
        const out = (r.structured_output ?? JSON.parse(r.result)).categories
        if (out.length !== data.issues.length) throw new Error(`got ${out.length} of ${data.issues.length}`)
        data.issues.forEach((x, i) => (x.category = out[i]))
        fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
        console.log(`ok ${pr} ${out.length}`)
      } catch (e) {
        console.log(`FAILED ${pr}: ${String(e.message).slice(0, 200)}`)
      }
      resolve()
    })
  })

const queue = require(path.join(root, 'prs.json'))
  .map((p) => p.pr)
  .filter((pr) => {
    const file = path.join(root, 'results', String(pr), 'issues.json')
    if (!fs.existsSync(file)) return false
    const { issues } = require(file)
    return issues.length && issues.some((x) => !x.category)
  })

;(async () => {
  await Promise.all(Array.from({ length: jobs }, async () => { while (queue.length) await run(queue.shift()) }))
})()
