import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { playwrightSpecs } from './playwright-specs.mjs'
import { chainProfiles } from './local-stack.mjs'
import { scenarios } from './scenarios/index.mjs'

const testsDir = new URL('../tests/', import.meta.url)
const constants = readFileSync(new URL('../src/data/constants.ts', import.meta.url), 'utf8')

test('every registered Playwright spec exists and names scenario functions', () => {
  for (const [spec, { scenarios: names = [] }] of Object.entries(playwrightSpecs)) {
    assert.ok(existsSync(new URL(spec, testsDir)), `${spec} does not exist`)
    for (const name of names) assert.equal(typeof scenarios[name], 'function', `${spec} names unknown scenario ${name}`)
  }
})

test('every fork that a Playwright spec names has a stack profile', () => {
  for (const [spec, { chains = [] }] of Object.entries(playwrightSpecs)) {
    for (const chainId of chains) assert.ok(chainProfiles[chainId], `${spec} names unknown fork ${chainId}`)
  }
})

test('every Playwright spec is registered, so isolated runs include it', () => {
  const specs = readdirSync(testsDir, { recursive: true }).filter((file) => file.endsWith('.spec.ts'))
  assert.deepEqual(
    specs.filter((spec) => !Object.hasOwn(playwrightSpecs, spec)),
    [],
  )
})

test('mapped Safes are keys of SAFES and come from a scenario of the spec', () => {
  for (const [spec, { scenarios: names = [], safes = {} }] of Object.entries(playwrightSpecs)) {
    if (Object.keys(safes).length) assert.ok(names.length, `${spec} maps Safes but names no scenario`)
    for (const key of Object.keys(safes))
      assert.match(constants, new RegExp(`\\b${key}: '[a-z]+:0x`), `${spec}: ${key}`)
  }
})
