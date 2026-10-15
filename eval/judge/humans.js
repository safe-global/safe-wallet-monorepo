// Human benchmark: for each issue humans raised (E), and each issue only C raised, records what the humans did with it.
// verdict: accepted (fixed before merge or agreed), rejected (declined or explained as intended), open (no reaction).
// present: whether the problem already existed at the review SHA, so the bots could have seen it.
// Writes results/<pr>/humans.json. Usage: node eval/judge/humans.js <owner/repo> [pr...]   (env CLAUDE_BIN, JOBS)
const { execFile, execFileSync, execSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const [owner, name] = process.argv[2].split('/')
const root = path.join(__dirname, '..')
const repo = path.join(root, '..')
const claude = process.env.CLAUDE_BIN || 'claude'
const jobs = Number(process.env.JOBS || 3)
const sh = (c) => execSync(c, { encoding: 'utf8', maxBuffer: 1 << 26, cwd: root }).trim()
const schema = JSON.stringify({
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          issue: { type: 'integer' },
          verdict: { enum: ['accepted', 'rejected', 'open'] },
          present: { type: 'boolean' },
          evidence: { type: 'string' },
        },
        required: ['issue', 'verdict', 'present', 'evidence'],
      },
    },
  },
  required: ['verdicts'],
})
const threadsQuery = `query($n:Int!){repository(owner:"${owner}",name:"${name}"){pullRequest(number:$n){headRefOid author{login}
  reviewThreads(first:100){nodes{isResolved path line originalLine comments(first:50){nodes{author{login} body createdAt}}}}
  reviews(first:100){nodes{author{login} body state submittedAt}}
  comments(first:100){nodes{author{login} body createdAt}}}}}`

const conversation = (pr) => {
  const d = JSON.parse(sh(`gh api graphql -f query='${threadsQuery}' -F n=${pr}`)).data.repository.pullRequest
  const fmt = (c) => `[${c.author?.login ?? '?'} ${c.createdAt ?? c.submittedAt}] ${c.body}`
  const threads = d.reviewThreads.nodes.map((t) => `THREAD ${t.path}:${t.line ?? t.originalLine} resolved=${t.isResolved}\n${t.comments.nodes.map(fmt).join('\n')}`)
  const reviews = d.reviews.nodes.filter((r) => r.body).map((r) => `REVIEW ${r.state}\n${fmt(r)}`)
  const comments = d.comments.nodes.map((c) => `COMMENT\n${fmt(c)}`)
  return { head: d.headRefOid, author: d.author.login, text: [...threads, ...reviews, ...comments].join('\n\n') }
}

const prompt = (p, conv, targets) => `Pull request #${p.pr}, author ${conv.author}. The working tree is the PR's final head. The bots reviewed commit ${p.reviewSha}; the PR's base is ${p.baseSha}.
Use \`git show ${p.reviewSha}:<file>\`, \`git diff ${p.reviewSha} HEAD -- <file>\` and \`git log ${p.reviewSha}..HEAD\` to see what changed after the review.

For each issue below, decide from the humans' reactions and the code changes, not from your own opinion of the issue:
- verdict: "accepted" if a later commit before merge addresses it, or the author or a reviewer explicitly agreed; "rejected" if the author or a reviewer declined it or explained the behaviour is intended; "open" if nobody reacted and the code did not change for it.
- present: true if the problem already existed at ${p.reviewSha}, false if it only appeared in later commits.
Cite the commit, thread or file:line in evidence (one or two sentences). Read-only: do not modify files, install anything or use the network.

ISSUES:
${targets.map((t) => `${t.i}. [${t.from}] ${t.summary}`).join('\n')}

PR CONVERSATION:
${conv.text.slice(0, 60000)}`

const run = (p) =>
  new Promise((resolve) => {
    const dir = path.join(root, 'results', String(p.pr))
    const key = require(path.join(dir, 'key.json'))
    const { issues } = require(path.join(dir, 'issues.json'))
    const targets = issues
      .map((x, i) => ({ i, summary: x.summary, by: new Set(x.findings.map((f) => key[f].sys)) }))
      .filter((t) => t.by.has('E') || (t.by.has('C') && t.by.size === 1))
      .map((t) => ({ ...t, from: t.by.has('E') ? 'raised by a human reviewer' : 'raised by the Claude review bot' }))
    if (!targets.length) {
      fs.writeFileSync(path.join(dir, 'humans.json'), JSON.stringify({ verdicts: [] }, null, 2) + '\n')
      return resolve()
    }
    let conv, wt
    try {
      conv = conversation(p.pr)
      try { sh(`git cat-file -e ${conv.head}^{commit}`) } catch { sh(`git fetch -q origin ${conv.head}`) }
      wt = fs.mkdtempSync(path.join(os.tmpdir(), `humans-${p.pr}-`))
      execFileSync('git', ['-C', repo, 'worktree', 'add', '-q', '--detach', wt, conv.head])
    } catch (e) {
      console.log(`FAILED ${p.pr}: ${String(e.message).slice(0, 200)}`)
      return resolve()
    }
    const args = ['-p', prompt(p, conv, targets), '--model', 'opus', '--json-schema', schema, '--output-format', 'json', '--no-session-persistence', '--disable-slash-commands',
      '--dangerously-skip-permissions', '--disallowedTools', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Bash(gh:*)', 'Bash(git push:*)', 'Bash(git commit:*)', 'Bash(git checkout:*)', 'Bash(curl:*)', 'Bash(wget:*)', 'Bash(yarn:*)', 'Bash(npm:*)', 'Bash(npx:*)']
    execFile(claude, args, { maxBuffer: 1 << 26, cwd: wt }, (err, stdout) => {
      try {
        if (err) throw err
        const r = JSON.parse(stdout)
        const { verdicts } = r.structured_output ?? JSON.parse(r.result)
        const missing = targets.filter((t) => !verdicts.some((v) => v.issue === t.i))
        if (missing.length) throw new Error(`missing verdicts for ${missing.map((t) => t.i)}`)
        fs.writeFileSync(path.join(dir, 'humans.json'), JSON.stringify({ usd: r.total_cost_usd, head: conv.head, verdicts }, null, 2) + '\n')
        fs.writeFileSync(path.join(dir, 'conversation.txt'), conv.text + '\n')
        console.log(`ok ${p.pr} ${verdicts.length} $${r.total_cost_usd.toFixed(2)}`)
      } catch (e) {
        console.log(`FAILED ${p.pr}: ${String(e.message).slice(0, 200)}`)
      }
      execFileSync('git', ['-C', repo, 'worktree', 'remove', '--force', wt])
      resolve()
    })
  })

const only = process.argv.slice(3).map(Number)
const queue = require(path.join(root, 'prs.json'))
  .filter((p) => !only.length || only.includes(p.pr))
  .filter((p) => fs.existsSync(path.join(root, 'results', String(p.pr), 'issues.json')))
  .filter((p) => !fs.existsSync(path.join(root, 'results', String(p.pr), 'humans.json')))

;(async () => {
  await Promise.all(Array.from({ length: jobs }, async () => { while (queue.length) await run(queue.shift()) }))
})()
