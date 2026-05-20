/**
 * Post, update, or delete the sticky page-screenshots PR comment.
 *
 * Loaded by .github/workflows/page-screenshots-publish.yml via
 * actions/github-script after a default-branch checkout.
 *
 * Env:
 *   PR_NUMBER — target PR number
 *   STALE     — "true" if the PR HEAD has moved since the build
 *   FOUND     — "true" if a validated artifact is available on disk
 */

const fs = require('fs')

const MARKER = '📸 Page Screenshots'
const COMMENT_HEADER = `## ${MARKER}`
const BOT_LOGIN = 'github-actions[bot]'
const FILENAME_REGEX = /^([a-z0-9_]+)__(desktop|mobile)\.png$/
const COLLAPSIBLE_THRESHOLD = 8

const slugToLabel = (slug) =>
  slug
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')

const buildBody = ({ stale, screenshots, baseUrl }) => {
  let body = `${COMMENT_HEADER}\n\n`
  if (stale) {
    body +=
      '> **STALE:** The PR was updated after these screenshots were captured. ' + 'A new run will refresh them.\n\n'
  }
  body += `Found ${screenshots.length} screenshot(s) for pages affected by changes in this PR.\n\n`

  const useCollapsible = screenshots.length >= COLLAPSIBLE_THRESHOLD
  for (const file of screenshots) {
    const match = file.match(FILENAME_REGEX)
    const label = match ? `${slugToLabel(match[1])} (${match[2]})` : file
    const imageUrl = `${baseUrl}/${file}`
    if (useCollapsible) {
      body += `<details>\n<summary>${label}</summary>\n\n`
      body += `![${label}](${imageUrl})\n\n`
      body += `</details>\n\n`
    } else {
      body += `### ${label}\n\n`
      body += `![${label}](${imageUrl})\n\n`
    }
  }

  body += '\n---\n'
  body += '*Screenshots are automatically captured from pages affected by changed files.*'
  return body
}

module.exports = async ({ github, context, core }) => {
  const prNumber = Number(process.env.PR_NUMBER)
  const stale = process.env.STALE === 'true'
  const found = process.env.FOUND === 'true'
  if (!Number.isFinite(prNumber)) {
    core.setFailed('PR_NUMBER env var must be a numeric PR number')
    return
  }
  const { owner, repo } = context.repo

  // Paginate: long-discussion PRs can push the sticky comment past page 1,
  // and matching the wrong comment would create duplicates instead of
  // updating in place.
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  })
  // Restrict to comments authored by this workflow's bot and starting with
  // the exact header `buildBody` writes — otherwise a quoted MARKER in any
  // other bot's comment would be edited or deleted on the next run.
  const existing = comments.find((c) => c.user.login === BOT_LOGIN && c.body.startsWith(COMMENT_HEADER))

  if (!found) {
    if (existing) {
      await github.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: existing.id,
      })
    }
    return
  }

  const screenshots = fs
    .readdirSync('page-screenshots')
    .filter((f) => f.endsWith('.png'))
    .sort()

  const storageBranch = `pr-${prNumber}-screenshots`
  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${storageBranch}/page-screenshots/${prNumber}`
  const body = buildBody({ stale, screenshots, baseUrl })

  if (existing) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    })
  } else {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    })
  }
}

module.exports.MARKER = MARKER
module.exports.COMMENT_HEADER = COMMENT_HEADER
module.exports.BOT_LOGIN = BOT_LOGIN
module.exports.FILENAME_REGEX = FILENAME_REGEX
module.exports.slugToLabel = slugToLabel
module.exports.buildBody = buildBody
