/**
 * Fixtures for specs in tests/isolated, which run against the local stack (`yarn e2e:env playwright`).
 *
 * A spec names its scenario with `test.use({ scenarioName: 'prepare…Scenario' })`. Each test then gets
 * fresh owners and its own Safes from the same scenario functions that the isolated Cypress specs use.
 */
import { cypressEnvironment } from '../../environment/cypress.mjs'
import { createOwners } from '../../environment/scenarios/safe.mjs'
import { scenarios } from '../../environment/scenarios/index.mjs'
import { test as base, expect } from './test.fixture'

type Owners = ReturnType<typeof createOwners>

/** Safes by group and name, as `<shortName>:<address>`, plus any other data the scenario returns. */
export type IsolatedScenario = { safes: Record<string, Record<string, string>> } & Record<string, unknown>

type ScenarioFunction = (env: Record<string, unknown>, owners: Owners) => Promise<unknown>

type IsolatedFixtures = {
  /** Name of a `prepare…Scenario` function in environment/scenarios. */
  scenarioName: string | undefined
  /** Four fresh, unfunded owners; OWNER_4 deploys the scenario's Safes. */
  owners: Owners
  scenario: IsolatedScenario
}

type IsolatedWorkerFixtures = {
  /** Service URLs of the local stack, in the form the scenario functions expect. */
  stack: Record<string, unknown>
}

function isScenario(value: unknown): value is IsolatedScenario {
  return typeof value === 'object' && value !== null && 'safes' in value && typeof value.safes === 'object'
}

function scenarioFunction(name: string): ScenarioFunction {
  const prepare: unknown = scenarios[name]
  if (typeof prepare !== 'function') throw new Error(`No scenario named ${name} in environment/scenarios`)
  return prepare as ScenarioFunction
}

export const test = base.extend<IsolatedFixtures, IsolatedWorkerFixtures>({
  stack: [
    async ({}, use) => {
      const stack = cypressEnvironment(process.env)
      if (stack.SAFE_E2E_ISOLATED !== true) throw new Error('Isolated specs need SAFE_E2E_ISOLATED=true')
      await use(stack)
    },
    { scope: 'worker' },
  ],

  scenarioName: [undefined, { option: true }],

  owners: async ({}, use) => {
    await use(createOwners())
  },

  scenario: async ({ stack, owners, scenarioName }, use) => {
    if (!scenarioName) throw new Error("Name the scenario with test.use({ scenarioName: 'prepare…Scenario' })")
    const result = await scenarioFunction(scenarioName)(stack, owners)
    if (!isScenario(result)) throw new Error(`${scenarioName} returned no safes`)
    if ('files' in result) throw new Error(`${scenarioName} writes Cypress fixture files, which Playwright cannot read`)
    await use(result)
  },
})

export { expect }
