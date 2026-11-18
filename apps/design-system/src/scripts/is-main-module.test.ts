import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, describe, it } from 'node:test'
import { pathToFileURL } from 'node:url'
import { isMainModule } from './is-main-module.ts'

describe('isMainModule', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'is-main-'))
  const dir = path.join(tmp, 'with space%20')
  mkdirSync(dir)
  const script = path.join(dir, 'script.ts')
  writeFileSync(script, '')
  const link = path.join(tmp, 'link.ts')
  symlinkSync(script, link)
  const argv = process.argv[1]

  const runAs = (entry: string | undefined, moduleUrl: string): boolean => {
    process.argv[1] = entry as string
    try {
      return isMainModule(moduleUrl)
    } finally {
      process.argv[1] = argv
    }
  }

  after(() => rmSync(tmp, { recursive: true, force: true }))

  it('matches a script whose path needs URL encoding', () => {
    assert.equal(runAs(script, pathToFileURL(script).href), true)
  })

  it('matches a script started through a symlink', () => {
    assert.equal(runAs(link, pathToFileURL(script).href), true)
  })

  it('does not match another module or a missing entry', () => {
    assert.equal(runAs(script, pathToFileURL(path.join(dir, 'other.ts')).href), false)
    assert.equal(runAs(undefined, pathToFileURL(script).href), false)
  })
})
