import { cypressEnvironment } from '../../environment/cypress.mjs'
import { short } from '../../environment/scenarios/chain.mjs'
import { createOwners } from '../../environment/scenarios/safe.mjs'
import { WalletPage } from '../pages/wallet.page'
import { seedConnectedWallet } from './seed-wallet'
import { test as base } from './test.fixture'

export type JourneyEnvironment = ReturnType<typeof cypressEnvironment> & { SAFE_RPC_URL: string }

export type Owners = ReturnType<typeof createOwners>
export type OwnerName = 'owner1' | 'owner2' | 'owner3' | 'owner4'

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
    await seedConnectedWallet(safePage, owners.owner4.privateKey)

    await provide({
      env: journeyEnvironment(),
      owners,
      connectAs: async (owner) => {
        const { address, privateKey } = owners[owner]
        // The init script that runs last wins, so `owner` replaces the one seeded before it
        await seedConnectedWallet(safePage, privateKey)
        if (safePage.url() === 'about:blank') return
        await safePage.reload()
        await wallet.accountCenter.filter({ hasText: short(address) }).waitFor()
      },
      recordSafe: (safe) => testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress }),
    })
  },
})

export { expect } from './test.fixture'
