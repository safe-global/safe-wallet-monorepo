/**
 * Resolve, download, and validate the page-screenshots artifact for the
 * originating workflow_run.
 *
 * Loaded by .github/workflows/page-screenshots-publish.yml via
 * actions/github-script. The publish workflow checks out the default branch
 * before requiring this file, so it always runs the trusted version.
 *
 * Sets two step outputs:
 *   found  — "true" if an artifact was downloaded and validated; "false" otherwise
 *   count  — number of PNGs (only set when found === "true")
 *
 * Env:
 *   RUN_ID — workflow_run id to look up the artifact under
 */

const fs = require('fs')
const { execSync } = require('child_process')

const FILENAME_REGEX = /^[a-z0-9_]+__(desktop|mobile)\.png$/
const ARTIFACT_NAME = 'page-screenshots'
const SIZE_CAP_BYTES = 50 * 1024 * 1024

module.exports = async ({ github, context, core }) => {
  const runId = Number(process.env.RUN_ID)
  if (!Number.isFinite(runId)) {
    core.setFailed('RUN_ID env var must be a numeric workflow_run id')
    return
  }

  const {
    data: { artifacts },
  } = await github.rest.actions.listWorkflowRunArtifacts({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: runId,
  })

  // Resolve by ID and require the artifact to belong to this exact
  // workflow_run so a stale or unrelated artifact cannot be picked up.
  const target = artifacts.find((a) => a.name === ARTIFACT_NAME && a.workflow_run.id === runId && !a.expired)

  if (!target) {
    core.notice('No screenshots artifact for this run; nothing to publish')
    core.setOutput('found', 'false')
    return
  }

  const dl = await github.rest.actions.downloadArtifact({
    owner: context.repo.owner,
    repo: context.repo.repo,
    artifact_id: target.id, // resolve by ID, never by name
    archive_format: 'zip',
  })

  fs.writeFileSync('page-screenshots.zip', Buffer.from(dl.data))
  fs.mkdirSync('page-screenshots', { recursive: true })
  execSync('unzip -o page-screenshots.zip -d page-screenshots', { stdio: 'inherit' })

  // Filename allowlist: `<routeSlug>__<viewport>.png`. Restricts characters
  // to [a-z0-9_] for the slug and one of two known viewports, so filenames
  // render predictably in markdown and map cleanly to filesystem paths.
  const entries = fs
    .readdirSync('page-screenshots', { withFileTypes: true })
    .filter((e) => e.isFile() && e.name !== '')
    .map((e) => e.name)

  const invalid = entries.filter((f) => !FILENAME_REGEX.test(f))
  if (invalid.length > 0) {
    core.setFailed(`Invalid filenames in artifact: ${invalid.join(', ')}`)
    return
  }

  const totalBytes = entries.reduce((sum, f) => sum + fs.statSync(`page-screenshots/${f}`).size, 0)
  if (totalBytes > SIZE_CAP_BYTES) {
    core.setFailed(`Artifact exceeds size cap: ${totalBytes} > ${SIZE_CAP_BYTES}`)
    return
  }

  core.setOutput('found', 'true')
  core.setOutput('count', String(entries.length))
}

module.exports.FILENAME_REGEX = FILENAME_REGEX
module.exports.SIZE_CAP_BYTES = SIZE_CAP_BYTES
