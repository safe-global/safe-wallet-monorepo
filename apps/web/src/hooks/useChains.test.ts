import { renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { applyFeatureOverrides, useHasFeature } from './useChains'
import * as store from '@/store'
import * as gateway from '@safe-global/store/gateway'
import * as useChainIdModule from './useChainId'

const makeChain = (features: string[]): Chain => ({ features }) as unknown as Chain

describe('applyFeatureOverrides', () => {
  it('returns the chain unchanged when there are no overrides', () => {
    const chain = makeChain([FEATURES.EARN])
    expect(applyFeatureOverrides(chain, {})).toBe(chain)
  })

  it('adds a forced-on feature', () => {
    const chain = makeChain([])
    const result = applyFeatureOverrides(chain, { [FEATURES.EARN]: true })
    expect(result.features).toContain(FEATURES.EARN)
  })

  it('removes a forced-off feature', () => {
    const chain = makeChain([FEATURES.EARN, FEATURES.BRIDGE])
    const result = applyFeatureOverrides(chain, { [FEATURES.EARN]: false })
    expect(result.features).not.toContain(FEATURES.EARN)
    expect(result.features).toContain(FEATURES.BRIDGE)
  })

  it('is a no-op in production', () => {
    const prev = process.env.NEXT_PUBLIC_IS_PRODUCTION
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
    try {
      const chain = makeChain([])
      expect(applyFeatureOverrides(chain, { [FEATURES.EARN]: true })).toBe(chain)
    } finally {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = prev
    }
  })
})

describe('useHasFeature with overrides', () => {
  const CHAIN_ID = '1'
  const rawChain = { chainId: CHAIN_ID, features: [] } as unknown as Chain

  beforeEach(() => {
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(CHAIN_ID)
    jest.spyOn(gateway, 'useGetChainsConfigV2Query').mockReturnValue({
      data: { ids: [CHAIN_ID], entities: { [CHAIN_ID]: rawChain } },
    } as unknown as ReturnType<typeof gateway.useGetChainsConfigV2Query>)
  })

  afterEach(() => jest.restoreAllMocks())

  it('reflects a forced-on override', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true })
    const { result } = renderHook(() => useHasFeature(FEATURES.EARN))
    expect(result.current).toBe(true)
  })

  it('reflects a forced-off override', () => {
    const chainWithEarn = { chainId: CHAIN_ID, features: [FEATURES.EARN] } as unknown as Chain
    jest.spyOn(gateway, 'useGetChainsConfigV2Query').mockReturnValue({
      data: { ids: [CHAIN_ID], entities: { [CHAIN_ID]: chainWithEarn } },
    } as unknown as ReturnType<typeof gateway.useGetChainsConfigV2Query>)
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: false })
    const { result } = renderHook(() => useHasFeature(FEATURES.EARN))
    expect(result.current).toBe(false)
  })
})
