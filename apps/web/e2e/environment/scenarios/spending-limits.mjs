import { rebuildStagingSafes } from './staging-safes.mjs'

export async function prepareSpendingLimitsScenario(env, owners) {
  const names = ['SEP_STATIC_SAFE_8', 'SEP_STATIC_SAFE_23', 'SEP_STATIC_SAFE_47']
  // Only the Polygon case needs this fork, so the Sepolia cases still run without it.
  if (env.SAFE_E2E_CHAINS?.[137]) names.push('MATIC_STATIC_SAFE_34')
  return { safes: { static: await rebuildStagingSafes(env, owners, names) } }
}

export async function prepareMassPayoutsScenario(env, owners) {
  return { safes: { static: await rebuildStagingSafes(env, owners, ['SEP_STATIC_SAFE_6', 'SEP_STATIC_SAFE_8']) } }
}
