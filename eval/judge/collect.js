// Writes runs/<pr>/C.json (@claude review) and E.json (first human review round) from GitHub.
// Usage: node eval/judge/collect.js   (needs gh; skips PRs that already have both files)
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const repo = 'repos/safe-global/safe-wallet-monorepo'
const gh = (p) => JSON.parse(execSync(`gh api --paginate --slurp "${p}"`, { encoding: 'utf8', maxBuffer: 1 << 26 })).flat()
const isBot = (u) => /\[bot\]$|^Copilot$/.test(u.login)
const inline = (c) => `${c.path}:${c.line ?? c.original_line ?? '?'}\n${c.body}`

const write = (p, system, output, extra) => {
  const file = path.join(root, 'runs', String(p.pr), `${system}.json`)
  const run = { pr: p.pr, reviewSha: p.reviewSha, baseSha: p.baseSha, system, version: 'github', runner: 'collect', ...extra, output }
  fs.writeFileSync(file, JSON.stringify(run, null, 2) + '\n')
}

for (const p of require(path.join(root, 'prs.json'))) {
  const dir = path.join(root, 'runs', String(p.pr))
  if (fs.existsSync(path.join(dir, 'E.json')) && (!p.hasC || fs.existsSync(path.join(dir, 'C.json')))) continue
  const pr = gh(`${repo}/pulls/${p.pr}`)[0]
  const author = pr.user.login
  const reviews = gh(`${repo}/pulls/${p.pr}/reviews`)
  const issue = gh(`${repo}/issues/${p.pr}/comments`)
  const comments = gh(`${repo}/pulls/${p.pr}/comments`)
  const commits = gh(`${repo}/pulls/${p.pr}/commits`)

  if (p.hasC) {
    const top = issue.find((c) => c.user.login === 'claude[bot]')
    const lines = comments.filter((c) => c.user.login === 'claude[bot]' && c.original_commit_id === p.reviewSha)
    write(p, 'C', [top?.body, ...lines.map(inline)].filter(Boolean).join('\n\n---\n\n'), { model: 'claude-code-action' })
  }

  // First human review round: the first reviewed commit, cut off at the next push.
  const human = (u) => !isBot(u) && u.login !== author
  const first = reviews.find((r) => human(r.user))
  const commentSha = first?.commit_id ?? null
  const cutoff = first ? commits.find((c) => c.commit.committer.date > first.submitted_at)?.commit.committer.date : undefined
  const parts = [
    ...reviews.filter((r) => human(r.user) && r.commit_id === commentSha && r.body).map((r) => `[review by ${r.user.login}]\n${r.body}`),
    ...comments.filter((c) => human(c.user) && c.original_commit_id === commentSha && !c.in_reply_to_id).map(inline),
    ...issue.filter((c) => human(c.user) && !/^@claude/.test(c.body) && (!cutoff || c.created_at < cutoff)).map((c) => c.body),
  ]
  write(p, 'E', parts.join('\n\n---\n\n'), { model: 'human', commentSha })
  process.stderr.write('.')
}
