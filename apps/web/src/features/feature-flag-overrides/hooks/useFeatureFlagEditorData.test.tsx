import { renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import * as gateway from '@safe-global/store/gateway'
import * as store from '@/store'
import type { RootState } from '@/store'
import * as useChainIdModule from '@/hooks/useChainId'
import { selectOverrideCount } from '@/features/feature-flag-overrides/store'
import { useFeatureFlagEditorData } from './useFeatureFlagEditorData'

const chain = (chainId: string, features: FEATURES[]): Chain => ({ chainId, features }) as unknown as Chain

const mockChains = (chains: Chain[]) =>
  jest.spyOn(gateway, 'useGetChainsConfigV2Query').mockReturnValue({
    data: {
      ids: chains.map((c) => c.chainId),
      entities: Object.fromEntries(chains.map((c) => [c.chainId, c])),
    },
  } as unknown as ReturnType<typeof gateway.useGetChainsConfigV2Query>)

describe('useFeatureFlagEditorData', () => {
  beforeEach(() => jest.spyOn(useChainIdModule, 'default').mockReturnValue('1'))
  afterEach(() => jest.restoreAllMocks())

  it('classifies chainScope as global / off / list', () => {
    mockChains([chain('1', [FEATURES.EARN]), chain('2', [FEATURES.EARN, FEATURES.BRIDGE])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({})
    const { result } = renderHook(() => useFeatureFlagEditorData())
    const all = [...result.current.overridden, ...result.current.rest]

    expect(all.find((r) => r.feature === FEATURES.EARN)?.chainScope).toBe('global')
    expect(all.find((r) => r.feature === FEATURES.BRIDGE)?.chainScope).toEqual([
      chain('2', [FEATURES.EARN, FEATURES.BRIDGE]),
    ])
    expect(all.find((r) => r.feature === FEATURES.RECOVERY)?.chainScope).toBe('off')
  })

  it('puts overridden flags in the overridden section, sorted alphabetically', () => {
    mockChains([chain('1', [])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true, [FEATURES.BRIDGE]: true })
    const { result } = renderHook(() => useFeatureFlagEditorData())

    expect(result.current.overridden.map((r) => r.feature)).toEqual([FEATURES.BRIDGE, FEATURES.EARN])
    expect(result.current.rest.some((r) => r.feature === FEATURES.EARN)).toBe(false)
  })

  it('computes effective and matchesCurrentChain', () => {
    mockChains([chain('1', [FEATURES.EARN])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true })
    const { result } = renderHook(() => useFeatureFlagEditorData())
    const row = result.current.overridden.find((r) => r.feature === FEATURES.EARN)

    expect(row?.configValue).toBe(true)
    expect(row?.override).toBe(true)
    expect(row?.effective).toBe(true)
    expect(row?.matchesCurrentChain).toBe(true)
  })

  it('forces a config-on flag off via override', () => {
    mockChains([chain('1', [FEATURES.EARN])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: false })
    const { result } = renderHook(() => useFeatureFlagEditorData())
    const row = result.current.overridden.find((r) => r.feature === FEATURES.EARN)

    expect(row?.configValue).toBe(true)
    expect(row?.override).toBe(false)
    expect(row?.effective).toBe(false)
    expect(row?.matchesCurrentChain).toBe(false)
  })

  it('forces a config-off flag on via override', () => {
    mockChains([chain('1', [])])
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ [FEATURES.EARN]: true })
    const { result } = renderHook(() => useFeatureFlagEditorData())
    const row = result.current.overridden.find((r) => r.feature === FEATURES.EARN)

    expect(row?.configValue).toBe(false)
    expect(row?.override).toBe(true)
    expect(row?.effective).toBe(true)
    expect(row?.matchesCurrentChain).toBe(false)
  })

  // The badge and this list are what a user compares, so pin them to the same literal against the
  // real hook and the real selector — one persisted override this build declares, one it does not.
  describe('with an override left behind by another branch', () => {
    const overrides = { [FEATURES.EARN]: true, FLAG_FROM_ANOTHER_BRANCH: true }

    beforeEach(() => {
      mockChains([chain('1', [])])
      jest.spyOn(store, 'useAppSelector').mockReturnValue(overrides)
    })

    it('lists it in neither section', () => {
      const { result } = renderHook(() => useFeatureFlagEditorData())
      const all = [...result.current.overridden, ...result.current.rest]

      expect(all.some((row) => String(row.feature) === 'FLAG_FROM_ANOTHER_BRANCH')).toBe(false)
    })

    it('lists one overridden row, which is what the badge counts', () => {
      const { result } = renderHook(() => useFeatureFlagEditorData())

      expect(result.current.overridden.map((row) => row.feature)).toEqual([FEATURES.EARN])
      expect(selectOverrideCount({ featureFlagOverrides: overrides } as unknown as RootState)).toBe(1)
    })
  })
})
