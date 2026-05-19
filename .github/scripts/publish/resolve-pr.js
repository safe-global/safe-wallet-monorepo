/**
 * Resolve the open PR for a given head SHA, with same-repo + state filtering,
 * and report whether the PR's current HEAD still matches the SHA from the
 * originating workflow_run (stale check).
 *
 * Loaded by .github/workflows/page-screenshots-publish.yml via
 * actions/github-script after a default-branch checkout.
 *
 * Sets three step outputs:
 *   skip   — "true" if there is no actionable PR (zero matches → designed skip)
 *   number — PR number (only when skip === "false")
 *   stale  — "true" if the PR's current HEAD differs from HEAD_SHA
 *
 * Env:
 *   HEAD_SHA — workflow_run.head_sha
 */

module.exports = async ({ github, context, core }) => {
  const headSha = process.env.HEAD_SHA
  if (!headSha) {
    core.setFailed('HEAD_SHA env var is required')
    return
  }

  const { data: prs } = await github.rest.repos.listPullRequestsAssociatedWithCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    commit_sha: headSha,
  })

  const sameRepo = `${context.repo.owner}/${context.repo.repo}`
  const candidates = prs.filter(
    (pr) => pr.state === 'open' && pr.head.sha === headSha && pr.head.repo.full_name === sameRepo,
  )

  if (candidates.length === 0) {
    core.notice(`No open PR found for ${headSha}; PR likely closed since build`)
    core.setOutput('skip', 'true')
    return
  }
  if (candidates.length > 1) {
    core.setFailed(`Ambiguous PR resolution: ${candidates.length} candidates for ${headSha}`)
    return
  }

  const pr = candidates[0]
  const { data: current } = await github.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number,
  })
  const stale = current.head.sha !== headSha

  core.setOutput('skip', 'false')
  core.setOutput('number', String(pr.number))
  core.setOutput('stale', stale ? 'true' : 'false')
}
