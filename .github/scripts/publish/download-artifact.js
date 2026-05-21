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

// Per-artifact-type config. Keep the page-screenshots default so callers that
// don't set ARTIFACT_TYPE continue to behave as before.
const ARTIFACT_CONFIG = {
  page: {
    name: 'page-screenshots',
    dir: 'page-screenshots',
    // `<routeSlug>__<viewport>.png` — slug is [a-z0-9_], viewport is one of two.
    filenameRegex: /^[a-z0-9_]+__(desktop|mobile)\.png$/,
  },
  storybook: {
    name: 'web-storybook-screenshots',
    dir: 'web-storybook-screenshots',
    // `<componentName>--<storyName>[-ERROR].png`. componentName derives from
    // the story title (slashes become `-`, whitespace is stripped); storyName
    // is a JS identifier (PascalCase by convention).
    filenameRegex: /^[A-Za-z0-9_-]+--[A-Za-z0-9_]+(-ERROR)?\.png$/,
  },
}
const SIZE_CAP_BYTES = 50 * 1024 * 1024
// Keep page-screenshots regex export for backwards-compatible callers.
const FILENAME_REGEX = ARTIFACT_CONFIG.page.filenameRegex

module.exports = async ({ github, context, core }) => {
  const artifactType = process.env.ARTIFACT_TYPE || 'page'
  const config = ARTIFACT_CONFIG[artifactType]
  if (!config) {
    core.setFailed(`Unknown ARTIFACT_TYPE: ${artifactType}`)
    return
  }
  const { name: ARTIFACT_NAME, dir: ARTIFACT_DIR, filenameRegex } = config

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

  // Match by ID and require the artifact to belong to this exact
  // workflow_run so an unrelated or expired artifact is not picked up.
  const target = artifacts.find((a) => a.name === ARTIFACT_NAME && a.workflow_run.id === runId && !a.expired)

  if (!target) {
    core.notice('No screenshots artifact for this run; nothing to publish')
    core.setOutput('found', 'false')
    return
  }

  const dl = await github.rest.actions.downloadArtifact({
    owner: context.repo.owner,
    repo: context.repo.repo,
    artifact_id: target.id,
    archive_format: 'zip',
  })

  const zipPath = `${ARTIFACT_DIR}.zip`
  fs.writeFileSync(zipPath, Buffer.from(dl.data))
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
  execSync(`unzip -o ${zipPath} -d ${ARTIFACT_DIR}`, { stdio: 'inherit' })

  // Validate filenames against the expected shape so markdown rendering and
  // filesystem paths stay predictable. Page: `<routeSlug>__<viewport>.png`.
  // Storybook: `<componentName>--<storyName>[-ERROR].png`.
  const entries = fs
    .readdirSync(ARTIFACT_DIR, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)

  const invalid = entries.filter((f) => !filenameRegex.test(f))
  if (invalid.length > 0) {
    core.setFailed(`Invalid filenames in artifact: ${invalid.join(', ')}`)
    return
  }

  const totalBytes = entries.reduce((sum, f) => sum + fs.statSync(`${ARTIFACT_DIR}/${f}`).size, 0)
  if (totalBytes > SIZE_CAP_BYTES) {
    core.setFailed(`Artifact exceeds size cap: ${totalBytes} > ${SIZE_CAP_BYTES}`)
    return
  }

  core.setOutput('found', 'true')
  core.setOutput('count', String(entries.length))
}

module.exports.FILENAME_REGEX = FILENAME_REGEX
module.exports.ARTIFACT_CONFIG = ARTIFACT_CONFIG
module.exports.SIZE_CAP_BYTES = SIZE_CAP_BYTES
