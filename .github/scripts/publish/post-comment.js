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

const BOT_LOGIN = 'github-actions[bot]'
const COLLAPSIBLE_THRESHOLD = 8

const slugToLabel = (slug) =>
  slug
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')

const ARTIFACT_PROFILES = {
  page: {
    marker: '📸 Page Screenshots',
    dir: 'page-screenshots',
    storageSegment: 'page-screenshots',
    storageBranchSuffix: 'screenshots',
    filenameRegex: /^([a-z0-9_]+)__(desktop|mobile)\.png$/,
    summary: (count) => `Found ${count} screenshot(s) for pages affected by changes in this PR.`,
    footer: '*Screenshots are automatically captured from pages affected by changed files.*',
    label: (file, match) => (match ? `${slugToLabel(match[1])} (${match[2]})` : file),
  },
  storybook: {
    marker: '📸 Storybook Component Screenshots',
    dir: 'web-storybook-screenshots',
    storageSegment: 'web-storybook-screenshots',
    storageBranchSuffix: 'storybook-screenshots',
    filenameRegex: /^([A-Za-z0-9_-]+)--([A-Za-z0-9_]+)(-ERROR)?\.png$/,
    summary: (count) => `Found ${count} screenshot(s) for Storybook components modified in this PR.`,
    footer: '*Screenshots captured from deployed Storybook preview.*',
    label: (file, match) => (match ? `${match[1]} — ${match[2]}${match[3] ? ' (ERROR)' : ''}` : file),
  },
}

// Backwards-compatible exports for any caller importing the page-screenshots
// values directly.
const MARKER = ARTIFACT_PROFILES.page.marker
const COMMENT_HEADER = `## ${MARKER}`
const FILENAME_REGEX = ARTIFACT_PROFILES.page.filenameRegex

const buildBody = ({ stale, screenshots, baseUrl, profile }) => {
  const header = `## ${profile.marker}`
  let body = `${header}\n\n`
  if (stale) {
    body +=
      '> **STALE:** The PR was updated after these screenshots were captured. ' + 'A new run will refresh them.\n\n'
  }
  body += `${profile.summary(screenshots.length)}\n\n`

  const useCollapsible = screenshots.length >= COLLAPSIBLE_THRESHOLD
  for (const file of screenshots) {
    const match = file.match(profile.filenameRegex)
    const label = profile.label(file, match)
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
  body += profile.footer
  return body
}

module.exports = async ({ github, context, core }) => {
  const artifactType = process.env.ARTIFACT_TYPE || 'page'
  const profile = ARTIFACT_PROFILES[artifactType]
  if (!profile) {
    core.setFailed(`Unknown ARTIFACT_TYPE: ${artifactType}`)
    return
  }
  const commentHeader = `## ${profile.marker}`

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
  // Match comments authored by this workflow's bot whose body starts with
  // the exact header `buildBody` writes, so we update the existing sticky
  // comment in place rather than matching a quoted marker elsewhere.
  const existing = comments.find((c) => c.user.login === BOT_LOGIN && c.body.startsWith(commentHeader))

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
    .readdirSync(profile.dir)
    .filter((f) => f.endsWith('.png'))
    .sort()

  const storageBranch = `pr-${prNumber}-${profile.storageBranchSuffix}`
  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${storageBranch}/${profile.storageSegment}/${prNumber}`
  const body = buildBody({ stale, screenshots, baseUrl, profile })

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
module.exports.ARTIFACT_PROFILES = ARTIFACT_PROFILES
module.exports.slugToLabel = slugToLabel
module.exports.buildBody = buildBody
