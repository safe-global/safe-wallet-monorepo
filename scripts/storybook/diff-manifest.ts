/**
 * Compares two sheet manifests written by `render-sweep.ts --manifest` and prints a Markdown
 * summary of the sheets whose pixels changed.
 *
 * Usage: npx tsx scripts/storybook/diff-manifest.ts <base.json> <head.json>
 */

import * as fs from 'fs'
import { diffManifests, formatDiff, type Manifest } from './manifest'

const readManifest = (file: string): Manifest => JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest

const [basePath, headPath] = process.argv.slice(2)
if (!basePath || !headPath) {
  console.error('Usage: diff-manifest.ts <base.json> <head.json>')
  process.exit(2)
}
if (!fs.existsSync(basePath)) {
  console.log(`No baseline manifest at ${basePath}: this run only records its own.`)
  process.exit(0)
}

const head = readManifest(headPath)
console.log(formatDiff(diffManifests(readManifest(basePath), head), Object.keys(head).length))
