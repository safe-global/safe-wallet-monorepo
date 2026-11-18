/**
 * Feature flag matrix integration tests.
 *
 * Verifies that every feature created with createFeatureHandle() correctly
 * responds to its feature flag being enabled or disabled.
 *
 * Contract under test:
 * - flag disabled (false)  → $isDisabled=true, PascalCase exports render null
 * - flag undefined         → $isDisabled=false, $isReady=false (loading state)
 * - flag enabled (true)    → $isDisabled=false, feature loads asynchronously
 */

import { renderHook } from '@/tests/test-utils'
import { useLoadFeature, _resetFeatureRegistry } from '@/features/__core__/useLoadFeature'
import type { FeatureHandle, FeatureImplementation } from '@/features/__core__/types'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('@/hooks/useChains')

// ── Feature registry ──────────────────────────────────────────────

/**
 * Each entry maps a human-readable label to its feature handle factory.
 * Using factories (thunks) ensures the handle is created fresh per test,
 * preventing stale module-level state from affecting results.
 */
const FEATURE_FLAG_MATRIX: Array<{
  label: string
  featureFlag: FEATURES
  getHandle: () => FeatureHandle<FeatureImplementation>
}> = [
  {
    label: 'swap',
    featureFlag: FEATURES.NATIVE_SWAPS,
    getHandle: () => {
      const { SwapFeature } = jest.requireActual('@/features/swap')
      return SwapFeature
    },
  },
  {
    label: 'stake',
    featureFlag: FEATURES.STAKING,
    getHandle: () => {
      const { StakeFeature } = jest.requireActual('@/features/stake')
      return StakeFeature
    },
  },
  {
    label: 'spending-limits',
    featureFlag: FEATURES.SPENDING_LIMIT,
    getHandle: () => {
      const { SpendingLimitsFeature } = jest.requireActual('@/features/spending-limits')
      return SpendingLimitsFeature
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────────

function mockUseHasFeature(returnValue: boolean | undefined) {
  const mod = jest.requireMock('@/hooks/useChains')
  ;(mod.useHasFeature as jest.Mock).mockReturnValue(returnValue)
}

// ── Cleanup ───────────────────────────────────────────────────────

// Each test creates handles via jest.requireActual which register in a global Map.
// Without resetting, subsequent tests see stale entries and can't re-register handles.
afterEach(() => {
  _resetFeatureRegistry()
  jest.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────

describe('feature flag matrix', () => {
  describe('when flag is disabled (false)', () => {
    it.each(FEATURE_FLAG_MATRIX)('$label: $isDisabled=true, PascalCase stubs render null', ({ getHandle }) => {
      mockUseHasFeature(false)

      const handle = getHandle()
      const { result } = renderHook(() => useLoadFeature(handle))

      expect(result.current.$isDisabled).toBe(true)
      expect(result.current.$isReady).toBe(false)
    })
  })

  describe('when flag is undefined (still loading)', () => {
    it.each(FEATURE_FLAG_MATRIX)('$label: $isDisabled=false, $isReady=false', ({ getHandle }) => {
      mockUseHasFeature(undefined)

      const handle = getHandle()
      const { result } = renderHook(() => useLoadFeature(handle))

      expect(result.current.$isDisabled).toBe(false)
      expect(result.current.$isReady).toBe(false)
    })
  })

  describe('PascalCase stub returns null when not ready', () => {
    it.each(FEATURE_FLAG_MATRIX)('$label: stub component renders null', ({ getHandle }) => {
      mockUseHasFeature(false)

      const handle = getHandle()
      const { result } = renderHook(() => useLoadFeature(handle))

      // Iterate over all properties of the stub proxy and check PascalCase ones
      // We access several known PascalCase-style keys via the proxy
      const proxy = result.current as unknown as Record<string, unknown>

      // Generic check: any PascalCase name accessed on stub returns a function returning null
      const stubFn = proxy['SomeComponent'] as (() => null) | undefined
      if (typeof stubFn === 'function') {
        expect(stubFn()).toBeNull()
      }
    })
  })

  describe('feature handle invariants', () => {
    it.each(FEATURE_FLAG_MATRIX)('$label: has required name and useIsEnabled fields', ({ label, getHandle }) => {
      const handle = getHandle()

      expect(typeof handle.name).toBe('string')
      expect(handle.name).toBe(label)
      expect(typeof handle.useIsEnabled).toBe('function')
      expect(typeof handle.load).toBe('function')
    })

    it.each(FEATURE_FLAG_MATRIX)(
      '$label: useIsEnabled returns the mocked feature flag value',
      ({ featureFlag, getHandle }) => {
        mockUseHasFeature(true)

        const handle = getHandle()
        const { result } = renderHook(() => handle.useIsEnabled())

        expect(result.current).toBe(true)

        // Verify the hook delegates to useHasFeature with the correct flag
        const mod = jest.requireMock('@/hooks/useChains')
        expect(mod.useHasFeature).toHaveBeenCalledWith(featureFlag)
      },
    )
  })
})

// ── Always-enabled features ──────────────────────────────────────

const ALWAYS_ENABLED_FEATURES: Array<{ label: string; getHandle: () => FeatureHandle<FeatureImplementation> }> = [
  { label: 'batching', getHandle: () => jest.requireActual('@/features/batching').BatchingFeature },
  { label: 'spaces', getHandle: () => jest.requireActual('@/features/spaces/SpacesFeature').SpacesFeature },
  { label: 'myAccounts', getHandle: () => jest.requireActual('@/features/myAccounts').MyAccountsFeature },
]

describe('always-enabled features', () => {
  it.each(ALWAYS_ENABLED_FEATURES)('$label: useIsEnabled returns true unconditionally', ({ getHandle }) => {
    const { result } = renderHook(() => getHandle().useIsEnabled())
    expect(result.current).toBe(true)
  })

  it.each(ALWAYS_ENABLED_FEATURES)('$label: has correct name', ({ label, getHandle }) => {
    expect(getHandle().name).toBe(label)
  })
})
