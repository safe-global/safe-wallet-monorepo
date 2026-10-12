import { createSafe } from './safe.mjs'

async function prepareOwnerSafes(env, owners, singleOwnerKeys, twoOwnerKeys) {
  const single = await createSafe(env, owners, { ownerAddresses: [owners.owner4.address], threshold: 1 })
  let multi
  try {
    multi = await createSafe(env, owners)
    return {
      safes: {
        static: Object.fromEntries([
          ...singleOwnerKeys.map((key) => [key, `sep:${single.safeAddress}`]),
          ...twoOwnerKeys.map((key) => [key, `sep:${multi.safeAddress}`]),
        ]),
      },
    }
  } finally {
    single.provider.destroy()
    multi?.provider.destroy()
  }
}

export function prepareAddOwnerScenario(env, owners) {
  return prepareOwnerSafes(env, owners, ['SEP_STATIC_SAFE_4'], ['SEP_STATIC_SAFE_3'])
}

export function prepareRemoveOwnerScenario(env, owners) {
  return prepareOwnerSafes(env, owners, ['SEP_STATIC_SAFE_3'], ['SEP_STATIC_SAFE_13'])
}

export function prepareReplaceOwnerScenario(env, owners) {
  return prepareOwnerSafes(env, owners, ['SEP_STATIC_SAFE_4'], ['SEP_STATIC_SAFE_25'])
}
