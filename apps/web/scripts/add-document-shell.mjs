import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// What the removed pages/_document.tsx rendered around Next's default document
const EDITS = [
  ['<html>', '<html lang="en">'],
  ['<body>', '<body><div class="root">'],
  ['<script id="__NEXT_DATA__"', '</div><script id="__NEXT_DATA__"'],
]

export const addDocumentShell = (html) =>
  EDITS.reduce((page, [from, to]) => {
    if (page.split(from).length !== 2) throw new Error(`Expected exactly one ${from} in an exported page`)
    return page.replace(from, to)
  }, html)

export const addDocumentShellToExport = (outDir) => {
  for (const file of readdirSync(outDir, { recursive: true })) {
    if (!file.endsWith('.html')) continue
    const path = join(outDir, file)
    const html = readFileSync(path, 'utf8')
    if (html.includes('<script id="__NEXT_DATA__"')) writeFileSync(path, addDocumentShell(html))
  }
}

if (process.argv[1]?.endsWith('add-document-shell.mjs')) addDocumentShellToExport('out')
