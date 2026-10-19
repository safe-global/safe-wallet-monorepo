import assert from 'node:assert/strict'
import { test } from 'node:test'
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createScenarioFixtures } from './fixtures.mjs'

async function fixtureSource(t) {
  const source = await mkdtemp(join(tmpdir(), 'safe-fixture-test-'))
  t.after(() => rm(source, { recursive: true, force: true }))
  await mkdir(join(source, 'history'))
  await writeFile(join(source, 'history/transactions.json'), JSON.stringify({ id: 'original' }))
  await writeFile(join(source, 'logo.svg'), '<svg/>')
  const fixtures = await createScenarioFixtures(source)
  t.after(fixtures.cleanup)
  await assert.rejects(access(fixtures.directory), { code: 'ENOENT' })
  await fixtures.prepare()
  return { ...fixtures, source }
}

test('supplies generated data at the existing fixture path without changing the source', async (t) => {
  const fixtures = await fixtureSource(t)
  await fixtures.prepare({ 'history/transactions.json': { id: 'generated' } })
  assert.deepEqual(JSON.parse(await readFile(join(fixtures.directory, 'history/transactions.json'), 'utf8')), {
    id: 'generated',
  })
  assert.deepEqual(JSON.parse(await readFile(join(fixtures.source, 'history/transactions.json'), 'utf8')), {
    id: 'original',
  })
  assert.equal(await readFile(join(fixtures.directory, 'logo.svg'), 'utf8'), '<svg/>')
})

test('restores original fixtures between scenarios and recreates the directory after cleanup', async (t) => {
  const fixtures = await fixtureSource(t)
  await fixtures.prepare({ 'history/transactions.json': { id: 'generated' } })
  await fixtures.prepare()
  assert.deepEqual(JSON.parse(await readFile(join(fixtures.directory, 'history/transactions.json'), 'utf8')), {
    id: 'original',
  })
  await fixtures.cleanup()
  await assert.rejects(access(fixtures.directory), { code: 'ENOENT' })
  await fixtures.prepare()
  await access(join(fixtures.directory, 'history/transactions.json'))
})

test('rejects escaping, missing and non-JSON paths before replacing fixtures', async (t) => {
  const fixtures = await fixtureSource(t)
  for (const name of [
    '../escape.json',
    '/escape.json',
    'history/../../escape.json',
    'history\\escape.json',
    'logo.svg',
  ]) {
    await assert.rejects(fixtures.prepare({ [name]: {} }), /existing JSON fixture/)
  }
  await assert.rejects(fixtures.prepare({ 'missing.json': {} }), { code: 'ENOENT' })
  await assert.rejects(fixtures.prepare({ 'history/transactions.json': { invalid: 1n } }), TypeError)
  await assert.rejects(fixtures.prepare({ 'history/transactions.json': undefined }), TypeError)
  assert.equal(await readFile(join(fixtures.directory, 'logo.svg'), 'utf8'), '<svg/>')
})
