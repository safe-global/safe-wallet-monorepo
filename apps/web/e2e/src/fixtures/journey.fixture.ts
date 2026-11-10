import { cypressEnvironment } from '../../environment/cypress.mjs'
import { short } from '../../environment/scenarios/chain.mjs'
import { createOwners } from '../../environment/scenarios/safe.mjs'
import { WalletPage } from '../pages/wallet.page'
import { seedSwitchableWallet } from './seed-wallet'
import { test as base } from './test.fixture'

export type JourneyEnvironment = ReturnType<typeof cypressEnvironment> & { SAFE_RPC_URL: string }

export type Owners = ReturnType<typeof createOwners>
export type OwnerName = 'owner1' | 'owner2' | 'owner3' | 'owner4'

const OWNER_NAMES: OwnerName[] = ['owner1', 'owner2', 'owner3', 'owner4']
/** Names the owner that the wallet connects on the next page load */
const CONNECTED_OWNER_COOKIE = 'e2e-connected-owner'

export type Journey = {
  env: JourneyEnvironment
  owners: Owners
  /** Connects `owner` in place of the connected owner; it stays connected on every later navigation */
  connectAs: (owner: OwnerName) => Promise<void>
  /** Names the Safe in the report of the test */
  recordSafe: (safe: { prefixedAddress: string }) => void
}

function journeyEnvironment(): JourneyEnvironment {
  const env = cypressEnvironment(process.env)
  if (!('SAFE_RPC_URL' in env) || typeof env.SAFE_RPC_URL !== 'string') {
    throw new Error(
      'Journeys need the isolated stack: run them with `yarn workspace @safe-global/web e2e:env playwright`',
    )
  }
  return { ...env, SAFE_RPC_URL: env.SAFE_RPC_URL }
}

/** Every journey starts connected as OWNER_4 */
export const test = base.extend<{ journey: Journey }>({
  // Not `use`: the React hooks lint rule takes that name for a hook.
  journey: async ({ safePage }, provide, testInfo) => {
    const owners = createOwners()
    const wallet = new WalletPage(safePage)
    const { baseURL } = testInfo.project.use
    if (!baseURL) throw new Error('Journeys need a baseURL for the cookie that names the connected owner')
    await seedSwitchableWallet(safePage, {
      keys: Object.fromEntries(OWNER_NAMES.map((name) => [name, owners[name].privateKey])),
      initial: 'owner4',
      cookie: CONNECTED_OWNER_COOKIE,
    })

    await provide({
      env: journeyEnvironment(),
      owners,
      connectAs: async (owner) => {
        await safePage.context().addCookies([{ name: CONNECTED_OWNER_COOKIE, value: owner, url: baseURL }])
        if (safePage.url() === 'about:blank') return
        await safePage.reload()
        await wallet.accountCenter.filter({ hasText: short(owners[owner].address) }).waitFor()
      },
      recordSafe: (safe) => testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress }),
    })
  },
})

export { expect } from './test.fixture'
