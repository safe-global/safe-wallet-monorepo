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

const commit = process.env.GITHUB_SHA || git('rev-parse', 'HEAD') || 'unknown'
const commitShort = commit === 'unknown' ? 'unknown' : commit.slice(0, 7)

const refName = process.env.GITHUB_REF_NAME || ''
const refType = process.env.GITHUB_REF_TYPE || ''
const tag = refType === 'tag' ? refName : git('describe', '--tags', '--exact-match') || null

const branch = refName && refType !== 'tag' ? refName : git('rev-parse', '--abbrev-ref', 'HEAD') || null

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
