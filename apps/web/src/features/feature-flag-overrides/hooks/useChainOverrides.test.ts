import { readFileSync } from 'fs'
import path from 'path'
import * as React from 'react'
import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { setIsProduction } from '@/tests/env'
import type { FeatureFlagOverridesState } from '@/features/feature-flag-overrides/store'
import { applyFeatureOverrides, useChainsWithOverrides } from './useChainOverrides'
import type * as ChainOverridesModule from './useChainOverrides'

const mockOverrides = jest.fn<FeatureFlagOverridesState, []>()

// The whole store is stubbed so the hooks need no Provider — the selector itself is covered by the
// slice's own tests. Registered with jest.mock so it also applies inside jest.isolateModules below.
jest.mock('@/store', () => ({ useAppSelector: () => mockOverrides() }))

const makeChain = (features: string[], chainId = '1'): Chain => ({ chainId, features }) as unknown as Chain

/**
 * Nothing here branches on *which* flag is toggled, so the flags are drawn fresh per test instead of
 * being pinned to two hardcoded ones: `overridden` is the flag under override, `untouched` the
 * bystander that must survive it. Distinct by construction — `arrayElements` samples without
 * replacement.
 */
const pickFeatures = (): FEATURES[] => faker.helpers.arrayElements(Object.values(FEATURES), 2)

/**
 * Re-imports the module into a fresh registry with a production env. The guard is a module-local
 * const evaluated once at module load, so — unlike the old call-time check — it cannot be flipped
 * from inside a test.
 */
const loadInProduction = (): typeof ChainOverridesModule => {
  const original = process.env.NEXT_PUBLIC_IS_PRODUCTION
  setIsProduction('true')
  let loaded: typeof ChainOverridesModule | undefined

  try {
    jest.isolateModules(() => {
      // The isolated registry would otherwise instantiate a second copy of React, whose hook
      // dispatcher is null during the outer render. Pin it to the instance renderHook renders with.
      jest.doMock('react', () => React)
      loaded = require('./useChainOverrides')
    })
  } finally {
    setIsProduction(original)
    jest.dontMock('react')
  }

  return loaded!
}

beforeEach(() => {
  mockOverrides.mockReturnValue({})
})

describe('applyFeatureOverrides', () => {
  it('returns the chain unchanged when there are no overrides', () => {
    const [overridden] = pickFeatures()
    const chain = makeChain([overridden])
    expect(applyFeatureOverrides(chain, {})).toBe(chain)
  })

  it('adds a forced-on feature', () => {
    const [overridden] = pickFeatures()
    const result = applyFeatureOverrides(makeChain([]), { [overridden]: true })
    expect(result.features).toContain(overridden)
  })

  it('removes a forced-off feature', () => {
    const [overridden, untouched] = pickFeatures()
    const result = applyFeatureOverrides(makeChain([overridden, untouched]), { [overridden]: false })
    expect(result.features).not.toContain(overridden)
    expect(result.features).toContain(untouched)
  })

  it('applies simultaneous force-on and force-off overrides', () => {
    const [forcedOff, forcedOn] = pickFeatures()
    const result = applyFeatureOverrides(makeChain([forcedOff]), { [forcedOff]: false, [forcedOn]: true })
    expect(result.features).not.toContain(forcedOff)
    expect(result.features).toContain(forcedOn)
  })

  it('handles an override key that is not a known feature (string cast)', () => {
    const chain = makeChain([])
    const overrides = { CUSTOM_UNKNOWN_FLAG: true } as unknown as FeatureFlagOverridesState
    const result = applyFeatureOverrides(chain, overrides)
    expect(result.features).toContain('CUSTOM_UNKNOWN_FLAG')
  })

  // The production policy lives in the hooks, not here. Pinning the purity keeps the guard from
  // creeping back in and re-splitting the check across two places.
  it('is pure: still applies overrides when loaded in a production build', () => {
    const [overridden] = pickFeatures()
    const { applyFeatureOverrides: applyInProduction } = loadInProduction()
    const result = applyInProduction(makeChain([]), { [overridden]: true })
    expect(result.features).toContain(overridden)
  })
})

// The editor's alert promises "every override is global: it applies to all chains, whatever
// per-chain scope the config service reports". These pin that claim: one override, chains that
// disagree with each other about the flag, and a uniform result either way.
describe('useChainsWithOverrides', () => {
  it('forces a flag on for every chain, including ones the config service excluded', () => {
    const [overridden, untouched] = pickFeatures()
    mockOverrides.mockReturnValue({ [overridden]: true })
    const chains = [makeChain([overridden], '1'), makeChain([], '137'), makeChain([untouched], '10')]

    const { result } = renderHook(() => useChainsWithOverrides(chains))

    expect(result.current).toHaveLength(3)
    expect(result.current.every((chain) => chain.features.includes(overridden))).toBe(true)
  })

  it('forces a flag off for every chain, including ones the config service enabled', () => {
    const [overridden, untouched] = pickFeatures()
    mockOverrides.mockReturnValue({ [overridden]: false })
    const chains = [makeChain([overridden], '1'), makeChain([overridden, untouched], '137')]

    const { result } = renderHook(() => useChainsWithOverrides(chains))

    expect(result.current.some((chain) => chain.features.includes(overridden))).toBe(false)
    // Untouched flags survive per chain.
    expect(result.current[1].features).toContain(untouched)
  })

  // ~300 files reach chain configs through this hook, many with `configs` in a dependency array, so
  // a fresh array on every render would ripple out as spurious re-renders and effect re-runs.
  it('keeps the same reference across re-renders while its inputs are unchanged', () => {
    const [overridden] = pickFeatures()
    mockOverrides.mockReturnValue({ [overridden]: true })
    const chains = [makeChain([])]

    const { result, rerender } = renderHook(() => useChainsWithOverrides(chains))
    const first = result.current
    rerender()

    expect(result.current).toBe(first)
  })

  it('returns the chains untouched in a production build', () => {
    const [overridden] = pickFeatures()
    mockOverrides.mockReturnValue({ [overridden]: true })
    const { useChainsWithOverrides: useInProduction } = loadInProduction()
    const chains = [makeChain([])]

    const { result } = renderHook(() => useInProduction(chains))

    expect(result.current).toBe(chains)
    expect(result.current[0].features).not.toContain(overridden)
  })
})

// `useChain` has no hook of its own: it passes a one-element array through this same hook, so the
// single-chain shape is pinned here rather than in a second entry point.
describe('useChainsWithOverrides with a single chain', () => {
  it('reflects an override on a one-element array', () => {
    const [overridden] = pickFeatures()
    mockOverrides.mockReturnValue({ [overridden]: true })

    const { result } = renderHook(() => useChainsWithOverrides([makeChain([])]))

    expect(result.current[0].features).toContain(overridden)
  })

  it('leaves an empty array empty, so a not-yet-loaded chain stays undefined', () => {
    const [overridden] = pickFeatures()
    mockOverrides.mockReturnValue({ [overridden]: true })

    const { result } = renderHook(() => useChainsWithOverrides([]))

    expect(result.current[0]).toBeUndefined()
  })
})

/**
 * Only the bundler can tell the inlined process.env check from an imported IS_PRODUCTION constant —
 * the two behave identically at runtime, so no behavioural test can distinguish them, but only the
 * inlined one folds away and drops the override path from production builds.
 */
describe('production guard form', () => {
  const source = readFileSync(path.join(__dirname, 'useChainOverrides.ts'), 'utf8')
  const CHECK = "process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'"

  it('guards on the inlined env check the bundler can fold', () => {
    expect(source).toContain(CHECK)
  })

  it('never imports the IS_PRODUCTION const', () => {
    expect(source).not.toMatch(/import\s*\{[^}]*\bIS_PRODUCTION\b[^}]*\}\s*from/)
  })

  // The point of this module: one check, in one place. A second occurrence means the policy has
  // started spreading again.
  it('states the check exactly once', () => {
    expect(source.split(CHECK)).toHaveLength(2)
  })
})
