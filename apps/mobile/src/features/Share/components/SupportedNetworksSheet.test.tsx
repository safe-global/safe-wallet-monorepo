import React from 'react'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { apiSliceWithChainsConfig, chainsAdapter, initialState } from '@safe-global/store/gateway/chains'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { CONFIG_SERVICE_KEY } from '@/src/config/constants'
import { SupportedNetworksSheet } from './SupportedNetworksSheet'

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'

const chain = (chainId: string, chainName: string): Chain =>
  ({ chainId, chainName, isTestnet: false, chainLogoUri: null }) as unknown as Chain

// Smoke test: the sheet does selector wiring (selectSafeChains → getChainsByIds), so render it
// through a real store seeded with the active Safe + chain config. Exercises the real selectors so
// a future signature change is caught here rather than at runtime.
const seededStore = async () => {
  const store = createTestStore({
    activeSafe: { address: SAFE_ADDRESS, chainId: '1' },
    // selectSafeChains reads the keys of safes[address]; the values are irrelevant here.
    safes: { [SAFE_ADDRESS]: { '1': {}, '137': {} } },
  } as never)
  // Await: upsertQueryData commits the cache entry on a microtask, so the chains must be in place
  // before we render or getChainsByIds resolves to [].
  await store.dispatch(
    apiSliceWithChainsConfig.util.upsertQueryData(
      'getChainsConfigV2',
      CONFIG_SERVICE_KEY,
      chainsAdapter.setAll(initialState, [chain('1', 'Ethereum'), chain('137', 'Polygon')]),
    ) as never,
  )
  return store
}

describe('SupportedNetworksSheet', () => {
  it('lists the chains the active Safe is deployed on', async () => {
    const { getByText } = renderWithStore(<SupportedNetworksSheet />, await seededStore())
    expect(getByText('Supported networks')).toBeTruthy()
    expect(getByText('Ethereum')).toBeTruthy()
    expect(getByText('Polygon')).toBeTruthy()
  })
})
