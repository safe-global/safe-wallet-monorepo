import { readFileSync } from 'fs'
import path from 'path'
import { faker } from '@faker-js/faker'
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
  // The wiring is chain-agnostic; all these ids have to be is different from each other. Drawn from
  // disjoint ranges so that holds by construction rather than by luck — `OTHER_CHAIN_ID` is the
  // second entry in the configs array, and the id the config service was never told about.
  const CHAIN_ID = faker.number.int({ min: 1, max: 999 }).toString()
  const OTHER_CHAIN_ID = faker.number.int({ min: 1000, max: 1999 }).toString()

  const mockChains = (chains: Chain[]) => {
    const ids = chains.map((chain) => (chain as unknown as { chainId: string }).chainId)
    jest.spyOn(gateway, 'useGetChainsConfigV2Query').mockReturnValue({
      data: { ids, entities: Object.fromEntries(ids.map((id, i) => [id, chains[i]])) },
    } as unknown as ReturnType<typeof gateway.useGetChainsConfigV2Query>)
  }

  const chainWith = (chainId: string, features: string[]) => ({ chainId, features }) as unknown as Chain

  // Which flag is overridden is irrelevant to the wiring under test, so it is drawn per test rather
  // than hardcoded.
  const pickFeature = (): FEATURES => faker.helpers.arrayElement(Object.values(FEATURES))

  beforeEach(() => {
    jest.spyOn(useChainIdModule, 'default').mockReturnValue(CHAIN_ID)
    mockChains([chainWith(CHAIN_ID, [])])
  })

  afterEach(() => jest.restoreAllMocks())

  it('applies overrides to the configs array', () => {
    const overridden = pickFeature()
    mockChains([chainWith(CHAIN_ID, []), chainWith(OTHER_CHAIN_ID, [])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [overridden]: true })

    const { result } = renderHook(() => useChains())

    expect(result.current.configs).toHaveLength(2)
    expect(result.current.configs.every((chain) => chain.features.includes(overridden))).toBe(true)
  })

  it('reflects a forced-on override', () => {
    const overridden = pickFeature()
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [overridden]: true })
    const { result } = renderHook(() => useHasFeature(overridden))
    expect(result.current).toBe(true)
  })

  it('reflects a forced-off override', () => {
    const overridden = pickFeature()
    mockChains([chainWith(CHAIN_ID, [overridden])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [overridden]: false })
    const { result } = renderHook(() => useHasFeature(overridden))
    expect(result.current).toBe(false)
  })

  // `useChain` wraps its chain in a one-element array for the array-only override hook. These pin
  // the two things that wrapping could get wrong: a missing chain must not become a truthy element,
  // and the array must not be rebuilt per render or every downstream memo would be invalidated.
  it('returns undefined for a chain the config service does not know', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [pickFeature()]: true })

    const { result } = renderHook(() => useChain(OTHER_CHAIN_ID))

    expect(result.current).toBeUndefined()
  })

  it('keeps the same chain reference across re-renders', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [pickFeature()]: true })

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
