// Blind judge: groups each PR's pooled findings into issues and labels them against the code at the review SHA.
// Writes results/<pr>/issues.json. Usage: node eval/judge/judge.js [pr...]   (env CLAUDE_BIN, JOBS; skips existing)
const { execFile, execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const root = path.join(__dirname, '..')
const repo = path.join(root, '..')
const claude = process.env.CLAUDE_BIN || 'claude'
const jobs = Number(process.env.JOBS || 3)
const labels = ['high', 'medium', 'low', 'nit', 'wrong', 'unverifiable']
const schema = JSON.stringify({
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          findings: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
          label: { enum: labels },
          evidence: { type: 'string' },
        },
        required: ['findings', 'summary', 'label', 'evidence'],
      },
    },
  },
  required: ['issues'],
})

const prompt = (b, base) => `You are judging review findings for pull request #${b.pr} of this repository. The working tree is checked out at the reviewed commit. The PR's changes are \`git diff ${base}...HEAD\`.

PR title: ${b.title}
PR description:
${b.description || '(none)'}

Below are review findings from several anonymous reviewers, pooled and shuffled. Do two things:

1. Group: put findings that describe the same underlying problem into one issue. Every finding id must appear in exactly one issue. Findings that merely sit near each other but describe different problems stay separate.

2. Label each issue by checking it against the code yourself (read files, grep, reason through the logic, evaluate small expressions with node if that settles a claim). Judge the claim on its merits, not on how confidently it is phrased.
   - high: a real defect with serious impact: wrong behaviour users would hit, security, funds or data loss.
   - medium: a real defect or risk with moderate impact, or missing tests for changed behaviour where a regression would plausibly go unnoticed.
   - low: correct but minor: an edge case unlikely in practice, a small maintainability or consistency problem with a concrete cost, a documentation mismatch.
   - nit: preference or style with no concrete cost.
   - wrong: the claim is factually incorrect, the code already handles it, or the behaviour is clearly intended (per the PR description or code comments).
   - unverifiable: cannot be settled from the code.
   A problem that predates the PR but sits in lines the PR changes can still be real. A problem entirely outside the PR's changes is at most low.

This is read-only: do not modify files, install dependencies, run tests or use the network. In evidence, cite file:line and say in one to three sentences why the label holds.

FINDINGS:
${JSON.stringify(b.findings, null, 1)}`

const run = (p) =>
  new Promise((resolve) => {
    const dir = path.join(root, 'results', String(p.pr))
    const b = require(path.join(dir, 'blind.json'))
    if (!b.findings.length) {
      fs.writeFileSync(path.join(dir, 'issues.json'), JSON.stringify({ issues: [] }, null, 2) + '\n')
      return resolve()
    }
    const wt = fs.mkdtempSync(path.join(os.tmpdir(), `judge-${p.pr}-`))
    execFileSync('git', ['-C', repo, 'worktree', 'add', '-q', '--detach', wt, p.reviewSha])
    const args = ['-p', prompt(b, p.baseSha), '--model', 'opus', '--json-schema', schema, '--output-format', 'json', '--no-session-persistence', '--disable-slash-commands',
      '--dangerously-skip-permissions', '--disallowedTools', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Bash(gh:*)', 'Bash(git push:*)', 'Bash(git commit:*)', 'Bash(git checkout:*)', 'Bash(curl:*)', 'Bash(wget:*)', 'Bash(yarn:*)', 'Bash(npm:*)', 'Bash(npx:*)']
    const start = Date.now()
    execFile(claude, args, { maxBuffer: 1 << 26, cwd: wt }, (err, stdout) => {
      try {
        if (err) throw err
        const r = JSON.parse(stdout)
        const { issues } = r.structured_output ?? JSON.parse(r.result)
        const seen = issues.flatMap((x) => x.findings)
        const missing = b.findings.map((f) => f.id).filter((id) => !seen.includes(id))
        const dupes = seen.filter((id, i) => seen.indexOf(id) !== i)
        if (missing.length || dupes.length) throw new Error(`bad grouping: missing ${missing} dupes ${dupes}`)
        const usage = { usd: r.total_cost_usd, turns: r.num_turns, wallSeconds: Math.round((Date.now() - start) / 1000) }
        fs.writeFileSync(path.join(dir, 'issues.json'), JSON.stringify({ usage, issues }, null, 2) + '\n')
        console.log(`ok ${p.pr} ${b.findings.length} findings -> ${issues.length} issues $${usage.usd.toFixed(2)}`)
      } catch (e) {
        console.log(`FAILED ${p.pr}: ${String(e.message).slice(0, 300)}`)
      }
      execFileSync('git', ['-C', repo, 'worktree', 'remove', '--force', wt])
      resolve()
    })
  })

const only = process.argv.slice(2).map(Number)
const queue = require(path.join(root, 'prs.json'))
  .filter((p) => !only.length || only.includes(p.pr))
  .filter((p) => fs.existsSync(path.join(root, 'results', String(p.pr), 'blind.json')))
  .filter((p) => !fs.existsSync(path.join(root, 'results', String(p.pr), 'issues.json')))

;(async () => {
  await Promise.all(Array.from({ length: jobs }, async () => { while (queue.length) await run(queue.shift()) }))
})()
