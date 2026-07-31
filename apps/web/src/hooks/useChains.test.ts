import { readFileSync } from 'fs'
import path from 'path'
import { renderHook } from '@/tests/test-utils'
import { setIsProduction } from '@/tests/env'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChains, { applyFeatureOverrides, useHasFeature } from './useChains'
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

  it('applies simultaneous force-on and force-off overrides', () => {
    const chain = makeChain([FEATURES.EARN])
    const result = applyFeatureOverrides(chain, { [FEATURES.EARN]: false, [FEATURES.BRIDGE]: true })
    expect(result.features).not.toContain(FEATURES.EARN)
    expect(result.features).toContain(FEATURES.BRIDGE)
  })

  it('handles an override key that is not a known feature (string cast)', () => {
    const chain = makeChain([])
    const overrides = { CUSTOM_UNKNOWN_FLAG: true } as unknown as Parameters<typeof applyFeatureOverrides>[1]
    const result = applyFeatureOverrides(chain, overrides)
    expect(result.features).toContain('CUSTOM_UNKNOWN_FLAG')
  })

  it('is a no-op in production', () => {
    const prev = process.env.NEXT_PUBLIC_IS_PRODUCTION
    setIsProduction('true')
    try {
      const chain = makeChain([])
      expect(applyFeatureOverrides(chain, { [FEATURES.EARN]: true })).toBe(chain)
    } finally {
      setIsProduction(prev)
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

// The editor's alert promises "every override is global: it applies to all chains, whatever
// per-chain scope the config service reports". These pin that claim: one override, chains that
// disagree with each other about the flag, and a uniform result either way.
describe('overrides are global across chains', () => {
  const chainWith = (chainId: string, features: string[]) => ({ chainId, features }) as unknown as Chain

  const mockChains = (chains: Chain[]) => {
    const ids = chains.map((c) => (c as unknown as { chainId: string }).chainId)
    jest.spyOn(gateway, 'useGetChainsConfigV2Query').mockReturnValue({
      data: { ids, entities: Object.fromEntries(ids.map((id, i) => [id, chains[i]])) },
    } as unknown as ReturnType<typeof gateway.useGetChainsConfigV2Query>)
  }

  afterEach(() => jest.restoreAllMocks())

  it('forces a flag on for every chain, including ones the config service excluded', () => {
    mockChains([chainWith('1', [FEATURES.EARN]), chainWith('137', []), chainWith('10', [FEATURES.BRIDGE])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true })

    const { result } = renderHook(() => useChains())

    expect(result.current.configs).toHaveLength(3)
    expect(result.current.configs.every((chain) => chain.features.includes(FEATURES.EARN))).toBe(true)
  })

  it('forces a flag off for every chain, including ones the config service enabled', () => {
    mockChains([chainWith('1', [FEATURES.EARN]), chainWith('137', [FEATURES.EARN, FEATURES.BRIDGE])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: false })

    const { result } = renderHook(() => useChains())

    expect(result.current.configs.some((chain) => chain.features.includes(FEATURES.EARN))).toBe(false)
    // Untouched flags survive per chain.
    expect(result.current.configs[1].features).toContain(FEATURES.BRIDGE)
  })
})

/**
 * The production short-circuits in `useChains` / `useChain` are a dead-code-elimination win, not a
 * behaviour change: `applyFeatureOverrides` already returns the identical chain in production, so
 * removing them changes nothing observable and no behavioural test can pin them.
 *
 * What must never regress is the *form* of the guard. `process.env.NEXT_PUBLIC_IS_PRODUCTION` is
 * substituted as a literal at parse time, so the bundler folds the branch and drops the override
 * path. The imported `IS_PRODUCTION` const behaves identically at runtime and would pass every
 * other test here, while silently shipping the override code. Hence a source-text assertion.
 */
describe('production guard form', () => {
  const source = readFileSync(path.join(__dirname, 'useChains.ts'), 'utf8')

  it('guards on the inlined env check the bundler can fold', () => {
    expect(source).toContain("process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'")
  })

  it('never imports the IS_PRODUCTION const', () => {
    expect(source).not.toMatch(/import\s*\{[^}]*\bIS_PRODUCTION\b[^}]*\}\s*from/)
  })
})
