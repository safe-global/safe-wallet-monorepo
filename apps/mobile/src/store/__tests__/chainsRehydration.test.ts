import { getStoredState, type Storage } from 'redux-persist'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { chainsAdapter } from '@safe-global/store/gateway/chains'
import { createMockChain } from '@safe-global/test'
import { CONFIG_SERVICE_KEY } from '@/src/config/constants'
import { persistTransforms, persistBlacklist } from '../index'

const chainsKey = `getChainsConfigV2("${CONFIG_SERVICE_KEY}")`

type RestoredQuery = { status?: string; data?: { entities?: Record<string, { chainName?: string }> } } | undefined
type RestoredApi = { queries?: Record<string, RestoredQuery> } | undefined

// Storage stub returning a pre-seeded "persist:root" blob in redux-persist's on-disk format (each
// top-level slice serialized independently). getStoredState then runs the real read path: deserialize
// + apply the outbound transforms (cgwClientFilter, then sanitize) in reduceRight order — exactly what
// happens on a cold start. This replays the incident where the app was killed mid-refetch.
const seededStorage = (apiSubstate: Record<string, unknown>): Storage => {
  const blob = JSON.stringify({
    [cgwClient.reducerPath]: JSON.stringify(apiSubstate),
    _persist: JSON.stringify({ version: 3, rehydrated: false }),
  })
  return {
    getItem: () => Promise.resolve(blob),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  }
}

const restoreApi = async (apiSubstate: Record<string, unknown>): Promise<RestoredApi> => {
  const restored = (await getStoredState({
    key: 'root',
    version: 3,
    storage: seededStorage(apiSubstate),
    blacklist: persistBlacklist,
    transforms: persistTransforms,
  })) as Record<string, RestoredApi>
  return restored[cgwClient.reducerPath]
}

describe('chains cache rehydration (incident replay)', () => {
  it('keeps cached chains as a fulfilled entry when the app was killed mid-refetch (pending + data)', async () => {
    const data = chainsAdapter.setAll(chainsAdapter.getInitialState(), [
      createMockChain({ chainId: '1', chainName: 'Ethereum' }),
    ])

    const api = await restoreApi({
      queries: { [chainsKey]: { status: 'pending', data, fulfilledTimeStamp: 1 } },
      config: { online: true },
    })

    const entry = api?.queries?.[chainsKey]
    expect(entry?.status).toBe('fulfilled')
    expect(entry?.data?.entities?.['1']?.chainName).toBe('Ethereum')
  })

  it('drops the entry when the interrupted request had no data (query re-initiates)', async () => {
    const api = await restoreApi({
      queries: { [chainsKey]: { status: 'pending', startedTimeStamp: 1 } },
      config: { online: true },
    })

    expect(api?.queries?.[chainsKey]).toBeUndefined()
  })
})
