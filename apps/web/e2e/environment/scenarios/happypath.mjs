import { addDelegates } from './proposers.mjs'
import { safeService } from './safe.mjs'
import { rebuildStagingSafes } from './staging-safes.mjs'
import { addressOf } from './chain.mjs'

export async function preparePayoutProposerScenario(env, owners) {
  const safes = await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_42'])
  await addDelegates(env, safeService(env, addressOf(safes.SEP_STATIC_SAFE_42)), [
    { delegate: owners.owner1.address, delegator: owners.owner4, label: 'Test proposer' },
  ])
  return { safes: { static: safes } }
}

export async function prepareOwnerLifecycleScenario(env, owners) {
  return { safes: { static: await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_24']) } }
}
