import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addDocumentShell, addDocumentShellToExport } from './add-document-shell.mjs'

const NEXT_DATA = '<script id="__NEXT_DATA__" type="application/json">{"page":"/"}</script>'

describe('addDocumentShell', () => {
  it('adds the language and the root wrapper that the removed _document rendered', () => {
    const exported = `<!DOCTYPE html><html><head><meta charSet="utf-8"/></head><body><link rel="preload" as="image" href="/logo.svg"/><div id="__next"><main>Safe</main></div>${NEXT_DATA}</body></html>`

    const page = addDocumentShell(exported)

    expect(page).toBe(
      `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/></head><body><div class="root"><link rel="preload" as="image" href="/logo.svg"/><div id="__next"><main>Safe</main></div></div>${NEXT_DATA}</body></html>`,
    )
  })

  it('throws when Next no longer renders a bare <html> tag', () => {
    const exported = `<!DOCTYPE html><html lang="de"><head></head><body><div id="__next"></div>${NEXT_DATA}</body></html>`

    expect(() => addDocumentShell(exported)).toThrow('Expected exactly one <html> in an exported page')
  })

  it('throws when Next no longer renders the __NEXT_DATA__ script', () => {
    const exported = '<!DOCTYPE html><html><head></head><body><div id="__next"></div></body></html>'

    expect(() => addDocumentShell(exported)).toThrow(
      'Expected exactly one <script id="__NEXT_DATA__" in an exported page',
    )
  })
})

describe('addDocumentShellToExport', () => {
  it('adds the shell to the exported Next pages and leaves other HTML files as they are', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'out-'))
    mkdirSync(join(outDir, 'welcome'))
    mkdirSync(join(outDir, 'storybook'))
    const nextPage = `<html><head></head><body><div id="__next"></div>${NEXT_DATA}</body></html>`
    const storybookPage = '<html><head></head><body><div id="storybook-root"></div></body></html>'
    writeFileSync(join(outDir, 'welcome', 'accounts.html'), nextPage)
    writeFileSync(join(outDir, 'storybook', 'index.html'), storybookPage)

    addDocumentShellToExport(outDir)

    expect(readFileSync(join(outDir, 'welcome', 'accounts.html'), 'utf8')).toBe(addDocumentShell(nextPage))
    expect(readFileSync(join(outDir, 'storybook', 'index.html'), 'utf8')).toBe(storybookPage)
  })
})
