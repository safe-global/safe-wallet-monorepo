/**
 * The data of a spec on the isolated stack. The registry in e2e/environment/playwright-specs.mjs names the spec's
 * scenarios; they run once per spec file and worker, with four fresh owners.
 */
import { relative, sep } from 'node:path'
import type { TestInfo } from '@playwright/test'
import { playwrightSpecs } from '../../environment/playwright-specs.mjs'
import type { createOwners } from '../../environment/scenarios/safe.mjs'

export type Owners = ReturnType<typeof createOwners>

/** Prefixed Safe addresses (`sep:0x…`) by the names that the spec's scenarios return. */
export type Safes = Record<string, string>

type SpecEntry = { scenarios?: string[]; chains?: number[]; devices?: string[] }
type ScenarioFunction = (env: Record<string, unknown>, owners: Owners) => Promise<unknown>
type SpecData = { safes: Safes; owners: Owners }

const registry: Record<string, SpecEntry> = playwrightSpecs
const prepared = new Map<string, Promise<SpecData>>()

function returnedSafes(scenario: string, result: unknown, declared: string[]): Safes {
  if (typeof result !== 'object' || result === null || !('safes' in result)) {
    throw new Error(`Scenario ${scenario} returned no safes`)
  }
  const safes = result.safes as Record<string, unknown>
  const names = Object.keys(safes)
  if (names.sort().join() !== [...declared].sort().join()) {
    throw new Error(`Scenario ${scenario} returned ${names.join(', ')}; scenarios/index.mjs declares ${declared}`)
  }
  return Object.fromEntries(names.map((name) => [name, String(safes[name])]))
}

function guarded(spec: string, safes: Safes): Safes {
  return new Proxy(safes, {
    get(target, key) {
      if (typeof key === 'string' && !(key in target)) {
        throw new Error(
          `${spec} reads safes.${key}; add a scenario that returns it in e2e/environment/playwright-specs.mjs`,
        )
      }
      return Reflect.get(target, key)
    },
  })
}

async function prepare(spec: string): Promise<SpecData> {
  const entry = registry[spec]
  if (!entry) throw new Error(`${spec} is not registered in e2e/environment/playwright-specs.mjs`)
  const { isolatedEnvironment } = await import('../../environment/isolated-environment.mjs')
  const { createOwners } = await import('../../environment/scenarios/safe.mjs')
  const { scenarios, scenarioSafes } = await import('../../environment/scenarios/index.mjs')
  const env = isolatedEnvironment(process.env)
  const owners = createOwners()
  const safes: Safes = {}
  // Sequential: the scenarios share Alice as the sender.
  for (const name of entry.scenarios ?? []) {
    const scenario: unknown = scenarios[name]
    if (typeof scenario !== 'function') throw new Error(`${spec} names unknown scenario ${name}`)
    const result = await (scenario as ScenarioFunction)(env, owners)
    Object.assign(safes, returnedSafes(name, result, scenarioSafes[name as keyof typeof scenarioSafes]))
  }
  return { safes: guarded(spec, safes), owners }
}

/** The spec's Safes and owners, prepared on first use in each worker. */
export function specData(testInfo: TestInfo): Promise<SpecData> {
  const spec = relative(testInfo.project.testDir, testInfo.file).split(sep).join('/')
  let data = prepared.get(spec)
  if (!data) {
    data = prepare(spec)
    prepared.set(spec, data)
  }
  return data
}
