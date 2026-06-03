#!/usr/bin/env node
// SRI assertion (mirrors the legacy intent of integrity-hashes.cjs).
//
// After `vite build`, re-hash every emitted JS/CSS asset and assert it matches
// the integrity recorded in `dist/sri-manifest.json` AND the `<script
// type="importmap">` embedded in `dist/index.html`. Also assert no JS chunk is
// left uncovered. Exits non-zero (failing the build) on any mismatch or gap.

import { createHash } from 'node:crypto'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const distDir = path.resolve(process.argv[2] ?? 'dist')
const manifestPath = path.join(distDir, 'sri-manifest.json')
const indexPath = path.join(distDir, 'index.html')

const fail = (message) => {
  console.error(`[SRI] ${message}`)
  process.exit(1)
}

if (!existsSync(manifestPath)) fail(`Missing ${manifestPath}. Did the import-map-integrity plugin run?`)
if (!existsSync(indexPath)) fail(`Missing ${indexPath}.`)

const sri = (buf) => `sha384-${createHash('sha384').update(buf).digest('base64')}`

const { integrity } = JSON.parse(readFileSync(manifestPath, 'utf-8'))
const entries = Object.entries(integrity)
if (entries.length === 0) fail('sri-manifest.json has no integrity entries.')

// 1. Re-hash every file referenced by the manifest and assert it matches.
let checked = 0
for (const [url, expected] of entries) {
  const filePath = path.join(distDir, url.replace(/^\//, ''))
  if (!existsSync(filePath)) fail(`Manifest references missing file: ${url}`)
  const actual = sri(readFileSync(filePath))
  if (actual !== expected) fail(`Integrity mismatch for ${url}\n  expected ${expected}\n  actual   ${actual}`)
  checked++
}

// 2. Assert no JS chunk in dist/assets is left uncovered (no silent gaps).
const assetsDir = path.join(distDir, 'assets')
if (existsSync(assetsDir)) {
  const uncovered = readdirSync(assetsDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => `/assets/${f}`)
    .filter((url) => !(url in integrity))
  if (uncovered.length > 0) fail(`JS chunks missing from SRI manifest:\n  ${uncovered.join('\n  ')}`)
}

// 3. Assert the embedded import map agrees with the manifest (JS entries).
const html = readFileSync(indexPath, 'utf-8')
const importMapMatch = html.match(/<script type="importmap">(.*?)<\/script>/s)
if (!importMapMatch) fail('No <script type="importmap"> found in index.html.')
const importMap = JSON.parse(importMapMatch[1])
for (const [url, expected] of entries) {
  if (!url.endsWith('.js')) continue
  if (importMap.integrity?.[url] !== expected) {
    fail(`Import map integrity for ${url} disagrees with sri-manifest.json.`)
  }
}

console.log(`[SRI] OK — ${checked} assets verified, import map consistent.`)
