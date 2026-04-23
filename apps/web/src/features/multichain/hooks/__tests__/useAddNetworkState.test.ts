import { renderHook } from '@testing-library/react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
  useCurrentChain: jest.fn(),
}))
jest.mock('@safe-global/utils/features/multichain/hooks/useCompatibleNetworks', () => ({
  useCompatibleNetworks: jest.fn(),
}))
jest.mock('../useSafeCreationData', () => ({
  useSafeCreationData: jest.fn(),
}))
jest.mock('../../utils', () => ({
  hasMultiChainAddNetworkFeature: jest.fn(),
}))

import useChains, { useCurrentChain } from '@/hooks/useChains'
import { useCompatibleNetworks } from '@safe-global/utils/features/multichain/hooks/useCompatibleNetworks'
import { useSafeCreationData } from '../useSafeCreationData'
import { hasMultiChainAddNetworkFeature } from '../../utils'
import { useAddNetworkState } from '../useAddNetworkState'

const asChain = (chainId: string, overrides: Partial<Chain> = {}): Chain =>
  ({
    chainId,
    chainName: `Chain-${chainId}`,
    shortName: `c${chainId}`,
    chainLogoUri: null,
    isTestnet: false,
    l2: false,
    ...overrides,
  }) as unknown as Chain

const configs = [asChain('1'), asChain('10'), asChain('137')]

const setupDefaults = (
  overrides: {
    featureEnabledByChainId?: Record<string, boolean>
    creationResult?: [unknown, Error | undefined, boolean]
    compatible?: Array<Chain & { available: boolean }>
    currentChainId?: string
  } = {},
) => {
  const currentChainId = overrides.currentChainId ?? '1'
  ;(useChains as unknown as jest.Mock).mockReturnValue({ configs })
  ;(useCurrentChain as jest.Mock).mockReturnValue(asChain(currentChainId))
  ;(useSafeCreationData as jest.Mock).mockReturnValue(
    overrides.creationResult ?? [{ masterCopy: '0xMasterCopy' }, undefined, false],
  )
  ;(useCompatibleNetworks as jest.Mock).mockReturnValue(
    overrides.compatible ?? configs.map((c) => ({ ...c, available: true })),
  )
  ;(hasMultiChainAddNetworkFeature as jest.Mock).mockImplementation((chain: Chain | undefined) => {
    if (!chain) return false
    const flags = overrides.featureEnabledByChainId
    return flags ? (flags[chain.chainId] ?? true) : true
  })
}

describe('useAddNetworkState', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns the filtered available networks when everything is ok', () => {
    setupDefaults()

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1']))

    expect(result.current.isFeatureEnabled).toBe(true)
    expect(result.current.unavailableReason).toBeNull()
    expect(result.current.availableNetworks.map((c) => c.chainId)).toEqual(['10', '137'])
  })

  it('marks unavailableReason "safe-specific" when creation data errored', () => {
    setupDefaults({ creationResult: [undefined, new Error('boom'), false] })

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1']))

    expect(result.current.unavailableReason).toBe('safe-specific')
    expect(result.current.availableNetworks).toEqual([])
    expect(result.current.error?.message).toBe('boom')
  })

  it('marks unavailableReason "outdated-mastercopy" when compatible networks list is empty but data exists', () => {
    setupDefaults({ compatible: [] })

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1']))

    expect(result.current.unavailableReason).toBe('outdated-mastercopy')
    expect(result.current.availableNetworks).toEqual([])
  })

  it('marks unavailableReason "safe-specific" when every compatible target chain is unavailable', () => {
    setupDefaults({
      compatible: configs.map((c) => ({ ...c, available: false })),
    })

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1']))

    expect(result.current.unavailableReason).toBe('safe-specific')
    expect(result.current.availableNetworks).toEqual([])
  })

  it('sets isFeatureEnabled=false when the current chain has no multi-chain feature', () => {
    setupDefaults({ featureEnabledByChainId: { '1': false, '10': true, '137': true } })

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1']))

    expect(result.current.isFeatureEnabled).toBe(false)
    // When feature is disabled on current chain, unavailableReason stays null;
    // the consumer is expected to simply not render the section.
    expect(result.current.unavailableReason).toBeNull()
  })

  it('filters out target chains that do not support the add-network feature', () => {
    setupDefaults({ featureEnabledByChainId: { '1': true, '10': false, '137': true } })

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1']))

    expect(result.current.availableNetworks.map((c) => c.chainId)).toEqual(['137'])
  })

  it('excludes already-deployed chains from availableNetworks', () => {
    setupDefaults()

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1', '10']))

    expect(result.current.availableNetworks.map((c) => c.chainId)).toEqual(['137'])
  })

  it('forwards the loading flag from useSafeCreationData', () => {
    setupDefaults({ creationResult: [undefined, undefined, true] })

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1']))

    expect(result.current.loading).toBe(true)
    expect(result.current.unavailableReason).toBeNull()
  })

  it('keeps unavailableReason null before data arrives so the dropdown can show a loader instead of a message', () => {
    setupDefaults({ creationResult: [undefined, undefined, true], compatible: [] })

    const { result } = renderHook(() => useAddNetworkState('0xSafe', ['1']))

    expect(result.current.loading).toBe(true)
    expect(result.current.unavailableReason).toBeNull()
  })
})
