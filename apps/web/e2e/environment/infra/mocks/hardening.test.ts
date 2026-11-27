import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { describe, it } from 'node:test'
import { listenHost } from './http.ts'

// The mocks need nothing else. A process, a file write or a third-party package in a mock fails this test.
const ALLOWED_IMPORTS = new Set(['node:crypto', 'node:fs', 'node:http', 'node:https', 'node:url'])
// From node:fs a mock may only read, so every other binding of the module is refused.
const ALLOWED_FS_IMPORT = /^\{\s*readFileSync\s*\}$/
const FORBIDDEN = [
  /\beval\s*\(/,
  /\bnew Function\b/,
  /\brequire\s*\(/,
  /\bimport\s*\(/,
  /\bgetBuiltinModule\b/,
  /\bprocess\.binding\b/,
]

const directory = new URL('./', import.meta.url)
const sources = readdirSync(directory)
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  .map((name) => ({ name, source: readFileSync(new URL(name, directory), 'utf8') }))
const compose = readFileSync(new URL('../docker-compose.test.yml', import.meta.url), 'utf8')

function imports(source: string): string[] {
  return [...source.matchAll(/^import\s[^'"]*['"]([^'"]+)['"]/gm)].map((match) => match[1])
}

/** The import clauses of `node:fs`, such as `{ readFileSync }` or `* as fs`. */
function fsImportClauses(source: string): string[] {
  return [...source.matchAll(/^import\s+([^'"]*?)\s+from\s+['"](?:node:)?fs(?:\/promises)?['"]/gm)].map((match) =>
    match[1].trim(),
  )
}

/** Splits Compose into its top-level `x-` anchors and its services, by name. */
function composeBlocks(): Map<string, string> {
  const blocks = new Map<string, string>()
  let name = ''
  let inServices = false
  for (const line of compose.split('\n')) {
    const topLevel = /^([\w-]+):/.exec(line)
    const service = inServices ? /^  ([\w-]+):/.exec(line) : null
    if (topLevel) inServices = topLevel[1] === 'services'
    if (topLevel || service) name = (topLevel ?? service)?.[1] ?? name
    blocks.set(name, `${blocks.get(name) ?? ''}${line}\n`)
  }
  return blocks
}

describe('mock hardening', () => {
  it('finds the mocks', () => {
    assert.ok(sources.length >= 8)
  })

  for (const { name, source } of sources) {
    it(`${name} imports only Node built-ins and other mocks`, () => {
      for (const specifier of imports(source)) {
        assert.ok(ALLOWED_IMPORTS.has(specifier) || /^\.\/[\w-]+\.ts$/.test(specifier), `${name} imports ${specifier}`)
      }
    })

    it(`${name} starts no process, writes no file and evaluates no code`, () => {
      for (const pattern of FORBIDDEN) assert.doesNotMatch(source, pattern, `${name} matches ${pattern}`)
      for (const clause of fsImportClauses(source)) {
        assert.match(clause, ALLOWED_FS_IMPORT, `${name} imports ${clause} from node:fs; only readFileSync is allowed`)
      }
    })
  }

  it('answers only this machine unless Compose sets MOCK_HOST', () => {
    const previous = process.env.MOCK_HOST
    delete process.env.MOCK_HOST
    try {
      assert.equal(listenHost(), '127.0.0.1')
    } finally {
      if (previous !== undefined) process.env.MOCK_HOST = previous
    }
  })

  it('runs every mock container read-only, unprivileged and without capabilities', () => {
    const blocks = composeBlocks()
    const anchor = blocks.get('x-mock') ?? ''
    for (const setting of [
      'image: ${NODE_IMAGE',
      '- MOCK_HOST=0.0.0.0',
      'user: node',
      'read_only: true',
      '- ALL',
      'no-new-privileges:true',
      './mocks:/mocks:ro',
    ]) {
      assert.ok(anchor.includes(setting), `x-mock lacks ${setting}`)
    }
    assert.equal(compose.match(/\$\{NODE_IMAGE/g)?.length, 1, 'only x-mock may use NODE_IMAGE')
    const extendsMock = /<<: \*(mock|fork-upstream|fork-rpc|anvil-init)\b/
    const startsMock = /command:\n\s+- \/mocks\//
    const mockBlocks = [...blocks].filter(
      ([name, block]) => name !== 'x-mock' && (extendsMock.test(block) || startsMock.test(block)),
    )
    assert.ok(mockBlocks.length >= 14)
    for (const [name, block] of mockBlocks) {
      assert.match(block, extendsMock, `${name} starts a mock without x-mock`)
      assert.doesNotMatch(block, /entrypoint:|user:|read_only:|privileged:|cap_add:/, `${name} weakens x-mock`)
    }
  })
})
