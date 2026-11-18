import { createSafe } from './safe.mjs'

export async function prepareBasicScenario(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.alice.address], threshold: 1 })
  try {
    return { safes: { basic: `sep:${context.safeAddress}` } }
  } finally {
    context.provider.destroy()
  }
}
