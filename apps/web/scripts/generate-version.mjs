#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '..')

const pkg = JSON.parse(readFileSync(resolve(webRoot, 'package.json'), 'utf8'))

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: webRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return ''
  }
}

// Prefer the checked-out commit over GITHUB_SHA: on pull_request events GITHUB_SHA is
// the merge commit, but our deploy workflows check out github.event.pull_request.head.sha
// — git rev-parse HEAD always matches the artifact that's actually being built.
const commit = git('rev-parse', 'HEAD') || process.env.GITHUB_SHA || 'unknown'
const commitShort = commit === 'unknown' ? 'unknown' : commit.slice(0, 7)

const refName = process.env.GITHUB_REF_NAME || ''
const refType = process.env.GITHUB_REF_TYPE || ''
const headRef = process.env.GITHUB_HEAD_REF || ''
const tag = git('describe', '--tags', '--exact-match') || (refType === 'tag' ? refName : null) || null

// On pull_request events GITHUB_REF_NAME is "<N>/merge" and HEAD is detached, so prefer
// GITHUB_HEAD_REF (the PR's source branch). Fall back to GITHUB_REF_NAME for push events,
// then to git (which returns "HEAD" when detached — filter that out).
const gitBranch = git('rev-parse', '--abbrev-ref', 'HEAD')
const branch =
  headRef || (refType === 'branch' ? refName : '') || (gitBranch && gitBranch !== 'HEAD' ? gitBranch : '') || null

const version = {
  version: pkg.version,
  commit,
  commitShort,
  tag,
  branch,
  buildTime: new Date().toISOString(),
}

const outPath = resolve(webRoot, 'public', 'version.json')
writeFileSync(outPath, JSON.stringify(version, null, 2) + '\n')
console.log(`Wrote ${outPath}:`, version)
