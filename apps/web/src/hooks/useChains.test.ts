import { readFileSync } from 'fs'
import path from 'path'
import { renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChains, { useChain, useHasFeature } from './useChains'
import * as store from '@/store'
import * as gateway from '@safe-global/store/gateway'
import * as useChainIdModule from './useChainId'

/**
 * Override *behaviour* is covered where it lives, in
 * `features/feature-flag-overrides/hooks/useChainOverrides.test.ts`. What is left here is the
 * wiring: proof that both paths out of this file — the `configs` array and the single-chain
 * `useChain`/`useCurrentChain`/`useHasFeature` chain — actually run through those hooks.
 */
describe('useChains override wiring', () => {
  const CHAIN_ID = '1'

  const mockChains = (chains: Chain[]) => {
    const ids = chains.map((chain) => (chain as unknown as { chainId: string }).chainId)
    jest.spyOn(gateway, 'useGetChainsConfigV2Query').mockReturnValue({
      data: { ids, entities: Object.fromEntries(ids.map((id, i) => [id, chains[i]])) },
    } as unknown as ReturnType<typeof gateway.useGetChainsConfigV2Query>)
  }

  const chainWith = (chainId: string, features: string[]) => ({ chainId, features }) as unknown as Chain

  beforeEach(() => {
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(CHAIN_ID)
    mockChains([chainWith(CHAIN_ID, [])])
  })

  afterEach(() => jest.restoreAllMocks())

  it('applies overrides to the configs array', () => {
    mockChains([chainWith(CHAIN_ID, []), chainWith('137', [])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true })

    const { result } = renderHook(() => useChains())

    expect(result.current.configs).toHaveLength(2)
    expect(result.current.configs.every((chain) => chain.features.includes(FEATURES.EARN))).toBe(true)
  })

  it('reflects a forced-on override', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true })
    const { result } = renderHook(() => useHasFeature(FEATURES.EARN))
    expect(result.current).toBe(true)
  })

  it('reflects a forced-off override', () => {
    mockChains([chainWith(CHAIN_ID, [FEATURES.EARN])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: false })
    const { result } = renderHook(() => useHasFeature(FEATURES.EARN))
    expect(result.current).toBe(false)
  })

  // `useChain` wraps its chain in a one-element array for the array-only override hook. These pin
  // the two things that wrapping could get wrong: a missing chain must not become a truthy element,
  // and the array must not be rebuilt per render or every downstream memo would be invalidated.
  it('returns undefined for a chain the config service does not know', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true })

    const { result } = renderHook(() => useChain('137'))

    expect(result.current).toBeUndefined()
  })

  it('keeps the same chain reference across re-renders', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true })

    const { result, rerender } = renderHook(() => useChain(CHAIN_ID))
    const first = result.current
    rerender()

    expect(result.current).toBe(first)
  })
})

/**
 * The production guard for overrides now lives in one place,
 * `features/feature-flag-overrides/hooks/useChainOverrides.ts`, which owns the source-form
 * assertions. This is the other half of that contract: the check must not creep back in here.
 */
describe('production guard placement', () => {
  it('leaves the production check to the feature', () => {
    const source = readFileSync(path.join(__dirname, 'useChains.ts'), 'utf8')
    expect(source).not.toContain('NEXT_PUBLIC_IS_PRODUCTION')
    expect(source).not.toMatch(/\bIS_PRODUCTION\b/)
  })
})
