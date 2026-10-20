import { cypressEnvironment } from '../../environment/cypress.mjs'
import { createOwners } from '../../environment/scenarios/safe.mjs'
import { seedConnectedWallet } from './seed-wallet'
import { test as base } from './test.fixture'

export type JourneyEnvironment = ReturnType<typeof cypressEnvironment> & { SAFE_RPC_URL: string }

export type Journey = {
  env: JourneyEnvironment
  owners: ReturnType<typeof createOwners>
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

export const test = base.extend<{ journey: Journey }>({
  // Not `use`: the React hooks lint rule takes that name for a hook.
  journey: async ({ safePage }, provide) => {
    const owners = createOwners()
    await seedConnectedWallet(safePage, owners.owner4.privateKey)
    await provide({ env: journeyEnvironment(), owners })
  },
})

export { expect } from './test.fixture'
