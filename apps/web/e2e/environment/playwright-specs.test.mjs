import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { playwrightSpecs } from './playwright-specs.mjs'
import { chainProfiles, deviceProfiles } from './local-stack.mjs'
import { scenarioSafes, scenarios } from './scenarios/index.mjs'

const testsDir = new URL('../tests/', import.meta.url)

test('every registered Playwright spec exists and names scenario functions', () => {
  for (const [spec, { scenarios: names = [] }] of Object.entries(playwrightSpecs)) {
    assert.ok(existsSync(new URL(spec, testsDir)), `${spec} does not exist`)
    for (const name of names) assert.equal(typeof scenarios[name], 'function', `${spec} names unknown scenario ${name}`)
  }
})

test('every scenario function serves at least one Playwright spec', () => {
  const used = new Set(Object.values(playwrightSpecs).flatMap(({ scenarios: names = [] }) => names))
  assert.deepEqual(
    Object.keys(scenarios).filter((name) => !used.has(name)),
    [],
  )
})

test('every fork and device emulator that a Playwright spec names has a stack profile', () => {
  for (const [spec, { chains = [], devices = [] }] of Object.entries(playwrightSpecs)) {
    for (const chainId of chains) assert.ok(chainProfiles[chainId], `${spec} names unknown fork ${chainId}`)
    for (const device of devices) assert.ok(deviceProfiles.includes(device), `${spec} names unknown device ${device}`)
  }
})

test('every Playwright spec is registered, so isolated runs include it', () => {
  const specs = readdirSync(testsDir, { recursive: true }).filter((file) => file.endsWith('.spec.ts'))
  assert.deepEqual(
    specs.filter((spec) => !Object.hasOwn(playwrightSpecs, spec)),
    [],
  )
})

test('every scenario declares the names of the Safes it returns', () => {
  assert.deepEqual(Object.keys(scenarioSafes).sort(), Object.keys(scenarios).sort())
})

test('the scenarios of a spec return each Safe name once', () => {
  for (const [spec, { scenarios: names = [] }] of Object.entries(playwrightSpecs)) {
    const safeNames = names.flatMap((name) => scenarioSafes[name])
    assert.deepEqual(safeNames, [...new Set(safeNames)], `${spec} gets one Safe name from two scenarios`)
  }
})

test('every Safe that a spec reads comes from a scenario of the spec', () => {
  for (const [spec, { scenarios: names = [] }] of Object.entries(playwrightSpecs)) {
    const source = readFileSync(new URL(spec, testsDir), 'utf8')
    if (!/^\s+safes,$/m.test(source)) continue
    const available = new Set(names.flatMap((name) => scenarioSafes[name]))
    for (const [, name] of source.matchAll(/\bsafes\.(\w+)/g)) {
      assert.ok(available.has(name), `${spec} reads safes.${name}, which none of its scenarios returns`)
    }
  }
})
