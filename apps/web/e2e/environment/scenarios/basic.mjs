import { createSafe } from './safe.mjs'

export async function prepareBasicScenario(env, owners) {
  const context = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  try {
    return {
      safes: {
        static: {
          SEP_STATIC_SAFE_0: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_2: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_3: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_9: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_13: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_4: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_6: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_8: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_7: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_23: `sep:${context.safeAddress}`,
          SEP_STATIC_SAFE_35: `sep:${context.safeAddress}`,
        },
      },
    }
  } finally {
    context.provider.destroy()
  }
}
