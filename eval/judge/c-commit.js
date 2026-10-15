// Finds the commit @claude review actually saw: the PR head when its first comment was posted.
// A force-push after that rewrites commit dates, so the head is rebuilt from the pre-push history.
// Usage: node eval/judge/c-commit.js <owner/repo>   (prints PRs whose review SHA is wrong; needs gh and git)
const { execSync } = require('child_process')
const path = require('path')

const [owner, name] = process.argv[2].split('/')
const root = path.join(__dirname, '..')
const sh = (c) => execSync(c, { encoding: 'utf8', maxBuffer: 1 << 26, cwd: root }).trim()
const query = `query($n:Int!){repository(owner:"${owner}",name:"${name}"){pullRequest(number:$n){
  commits(last:250){nodes{commit{oid committedDate}}}
  timelineItems(first:250,itemTypes:[HEAD_REF_FORCE_PUSHED_EVENT,ISSUE_COMMENT]){nodes{__typename
    ... on HeadRefForcePushedEvent{createdAt beforeCommit{oid}} ... on IssueComment{createdAt author{login}}}}}}}`

for (const p of require(path.join(root, 'prs.json')).filter((x) => x.hasC)) {
  const pr = JSON.parse(sh(`gh api graphql -f query='${query}' -F n=${p.pr}`)).data.repository.pullRequest
  const items = pr.timelineItems.nodes
  const at = items.find((x) => x.author?.login === 'claude')?.createdAt
  if (!at) continue
  const push = items.find((x) => x.__typename === 'HeadRefForcePushedEvent' && x.createdAt > at)
  let sha
  if (push) {
    // Head at `at` is the newest commit on the pre-push branch committed before `at`.
    try { sh(`git cat-file -e ${push.beforeCommit.oid}^{commit}`) } catch { sh(`git fetch -q origin ${push.beforeCommit.oid}`) }
    sha = sh(`git rev-list -1 --before=${at} ${push.beforeCommit.oid}`)
  } else {
    sha = pr.commits.nodes.map((n) => n.commit).filter((c) => c.committedDate <= at).at(-1)?.oid
  }
  if (sha !== p.reviewSha) console.log(JSON.stringify({ pr: p.pr, source: p.reviewShaSource, old: p.reviewSha, new: sha, forcePushed: !!push }))
}
