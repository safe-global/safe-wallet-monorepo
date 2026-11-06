/**
 * Compares two sheet manifests written by `render-sweep.ts --manifest` and prints a Markdown
 * summary of the sheets whose pixels changed.
 *
 * Usage: npx tsx scripts/storybook/diff-manifest.ts <base.json> <head.json> [<upload-list.txt>]
 */

import * as fs from 'fs'
import { diffManifests, formatDiff, type Manifest } from './manifest'

const readManifest = (file: string): Manifest => JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest

const [basePath, headPath, uploadListPath] = process.argv.slice(2)
if (!basePath || !headPath) {
  console.error('Usage: diff-manifest.ts <base.json> <head.json> [<upload-list.txt>]')
  process.exit(2)
}

// The upload list names the sheets a PR build must upload: changed and added ones, or all without a baseline
const head = readManifest(headPath)
const writeUploadList = (files: string[]) => uploadListPath && fs.writeFileSync(uploadListPath, files.join('\n'))

if (!fs.existsSync(basePath)) {
  console.log(`No baseline manifest at ${basePath}: this run only records its own.`)
  writeUploadList(Object.keys(head).sort())
  process.exit(0)
}

const diff = diffManifests(readManifest(basePath), head)
console.log(formatDiff(diff, Object.keys(head).length))
writeUploadList([...diff.changed, ...diff.added])
