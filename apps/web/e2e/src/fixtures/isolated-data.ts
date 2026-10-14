/**
 * Test data for runs against the isolated backend (`yarn e2e:env playwright`). The registry in
 * e2e/environment/playwright-specs.mjs names each spec's scenarios; they run once per spec file and worker,
 * like the isolated Cypress specs, and replace the staging Safes and wallets.
 */
import { relative, sep } from 'node:path'
import type { TestInfo } from '@playwright/test'
import { playwrightSpecs } from '../../environment/playwright-specs.mjs'
import type { createOwners } from '../../environment/scenarios/safe.mjs'
import type { SAFES } from '../data/constants'
import { getWalletCredentials, type WalletCredentials } from '../data/credentials'

export const isIsolated = process.env.SAFE_E2E_ISOLATED === 'true'

type SafeKey = keyof typeof SAFES

/** Prefixed Safe addresses (`sep:0x…`) by the keys of SAFES. */
export type Safes = Record<SafeKey, string>

type SpecEntry = { scenarios?: string[]; safes?: Partial<Record<SafeKey, string>> }
type ScenarioFunction = (env: Record<string, unknown>, owners: ReturnType<typeof createOwners>) => Promise<unknown>
type SpecData = { safes: Safes; credentials: WalletCredentials }

const registry: Record<string, SpecEntry> = playwrightSpecs
const prepared = new Map<string, Promise<SpecData>>()

function staticSafes(scenario: string, result: unknown): Record<string, string> {
  if (typeof result !== 'object' || result === null || !('safes' in result)) {
    throw new Error(`Scenario ${scenario} returned no safes`)
  }
  const { safes } = result
  if (typeof safes !== 'object' || safes === null || !('static' in safes)) return {}
  const category: unknown = safes.static
  if (typeof category !== 'object' || category === null) return {}
  return Object.fromEntries(Object.entries(category).map(([key, value]) => [key, String(value)]))
}

function mappedSafes(spec: string, entry: SpecEntry, available: Record<string, string>): Safes {
  const safes: Record<string, string> = {}
  for (const [key, scenarioKey] of Object.entries(entry.safes ?? {})) {
    if (!available[scenarioKey]) throw new Error(`${spec}: no scenario of the spec returns ${scenarioKey} for ${key}`)
    safes[key] = available[scenarioKey]
  }
  return new Proxy(safes as Safes, {
    get(target, key) {
      if (typeof key === 'string' && !(key in target)) {
        throw new Error(`${spec} reads ${key}; map it to a scenario Safe in e2e/environment/playwright-specs.mjs`)
      }
      return Reflect.get(target, key)
    },
  })
}

async function prepare(spec: string): Promise<SpecData> {
  const entry = registry[spec]
  if (!entry) throw new Error(`${spec} is not registered in e2e/environment/playwright-specs.mjs`)
  const { cypressEnvironment } = await import('../../environment/cypress.mjs')
  const { createOwners } = await import('../../environment/scenarios/safe.mjs')
  const { scenarios } = await import('../../environment/scenarios/index.mjs')
  const env = cypressEnvironment(process.env)
  const owners = createOwners()
  const available: Record<string, string> = {}
  // Sequential: the scenarios share OWNER_4 as the sender.
  for (const name of entry.scenarios ?? []) {
    const scenario: unknown = scenarios[name]
    if (typeof scenario !== 'function') throw new Error(`${spec} names unknown scenario ${name}`)
    Object.assign(available, staticSafes(name, await (scenario as ScenarioFunction)(env, owners)))
  }
  return {
    safes: mappedSafes(spec, entry, available),
    credentials: getWalletCredentials(JSON.stringify(owners.credentials)),
  }
}

/** The spec's Safes and wallets, prepared on first use in each worker. */
export function isolatedSpecData(testInfo: TestInfo): Promise<SpecData> {
  const spec = relative(testInfo.project.testDir, testInfo.file).split(sep).join('/')
  let data = prepared.get(spec)
  if (!data) {
    data = prepare(spec)
    prepared.set(spec, data)
  }
  return data
}
