import { renderHook, act } from '@testing-library/react'
import { useSpaceChainSelector } from './useSpaceChainSelector'
import type { SafeItem } from '@/hooks/safes/useAllSafes'
import type { MultiChainSafeItem } from '@/hooks/safes/useAllSafesGrouped'

// ── mocks ──────────────────────────────────────────────────────────────

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: jest.fn(),
  useCurrentSpaceId: jest.fn(() => '42'),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    CHAIN_SWITCHED: { action: 'Chain switched', category: 'spaces' },
  },
}))

jest.mock('@/services/analytics/mixpanel-events', () => ({
  MixpanelEventParams: {
    SAFE_ADDRESS: 'Safe Address',
    CHAIN_ID: 'Chain ID',
  },
}))
jest.mock('@/hooks/safes', () => ({
  isMultiChainSafeItem: jest.fn(),
}))
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/config/routes', () => ({
  AppRoutes: { home: '/home' },
}))

import { useSpaceSafes, useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useRouter } from 'next/router'
import { isMultiChainSafeItem } from '@/hooks/safes'

// ── helpers ────────────────────────────────────────────────────────────

const chainConfigs = [
  { chainId: '1', chainName: 'Ethereum', chainLogoUri: 'eth.png', shortName: 'eth' },
  { chainId: '137', chainName: 'Polygon', chainLogoUri: 'polygon.png', shortName: 'matic' },
]

const mockPush = jest.fn()

const singleChainSafe: SafeItem = {
  chainId: '1',
  address: '0xSafe1',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: 'My Safe',
}

const multiChainSafe: MultiChainSafeItem = {
  address: '0xSafe2',
  isPinned: false,
  lastVisited: 0,
  name: 'Multi Safe',
  safes: [
    { chainId: '1', address: '0xSafe2', isReadOnly: false, isPinned: false, lastVisited: 0, name: 'Multi Safe' },
    { chainId: '137', address: '0xSafe2', isReadOnly: false, isPinned: false, lastVisited: 0, name: 'Multi Safe' },
  ],
}

function setupDefaults(
  overrides: {
    allSafes?: Array<SafeItem | MultiChainSafeItem>
    safeAddress?: string
    currentChainId?: string
  } = {},
) {
  const allSafes = overrides.allSafes ?? [singleChainSafe]
  ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes })
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue('42')
  ;(useSafeInfo as jest.Mock).mockReturnValue({ safeAddress: overrides.safeAddress ?? '0xSafe1' })
  ;(useChainId as jest.Mock).mockReturnValue(overrides.currentChainId ?? '1')
  ;(useChains as jest.Mock).mockReturnValue({ configs: chainConfigs })
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  ;(isMultiChainSafeItem as unknown as jest.Mock).mockImplementation(
    (item: SafeItem | MultiChainSafeItem) => 'safes' in item,
  )
}

// ── tests ──────────────────────────────────────────────────────────────

describe('useSpaceChainSelector', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    setupDefaults()
  })

  it('returns the chains for the current safe', () => {
    const { result } = renderHook(() => useSpaceChainSelector())

    expect(result.current.chains).toHaveLength(1)
    expect(result.current.chains[0]).toMatchObject({ chainId: '1', chainName: 'Ethereum', shortName: 'eth' })
  })

  it('returns selectedChainId from useChainId', () => {
    const { result } = renderHook(() => useSpaceChainSelector())
    expect(result.current.selectedChainId).toBe('1')
  })

  it('returns hasMultipleChains=false for a single-chain safe', () => {
    const { result } = renderHook(() => useSpaceChainSelector())
    expect(result.current.hasMultipleChains).toBe(false)
  })

  it('returns hasMultipleChains=true for a multi-chain safe', () => {
    setupDefaults({ allSafes: [multiChainSafe], safeAddress: '0xSafe2' })

    const { result } = renderHook(() => useSpaceChainSelector())
    expect(result.current.hasMultipleChains).toBe(true)
    expect(result.current.chains).toHaveLength(2)
  })

  it('returns empty chains when the current safe is not found in allSafes', () => {
    setupDefaults({ allSafes: [], safeAddress: '0xSafe1' })

    const { result } = renderHook(() => useSpaceChainSelector())
    expect(result.current.chains).toHaveLength(0)
    expect(result.current.hasMultipleChains).toBe(false)
  })

  it('navigates to the same safe on a different chain when handleChainChange is called', () => {
    setupDefaults({ allSafes: [multiChainSafe], safeAddress: '0xSafe2' })

    const { result } = renderHook(() => useSpaceChainSelector())

    act(() => {
      result.current.handleChainChange('137')
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/home',
      query: { safe: 'matic:0xSafe2' },
    })
  })

  it('does not navigate when chain config is not found', () => {
    const { result } = renderHook(() => useSpaceChainSelector())

    act(() => {
      result.current.handleChainChange('999')
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('matches current safe using case-insensitive address comparison', () => {
    setupDefaults({ allSafes: [singleChainSafe], safeAddress: '0xsafe1' })

    const { result } = renderHook(() => useSpaceChainSelector())
    expect(result.current.chains).toHaveLength(1)
  })

  it('falls back to null for chainLogoUri when chain config exists but chainLogoUri is missing', () => {
    ;(useChains as jest.Mock).mockReturnValue({
      configs: [{ chainId: '1', chainName: 'Ethereum', shortName: 'eth' }],
    })

    const { result } = renderHook(() => useSpaceChainSelector())
    expect(result.current.chains[0]).toMatchObject({
      chainId: '1',
      chainName: 'Ethereum',
      shortName: 'eth',
      chainLogoUri: null,
    })
  })

  it('falls back to chainId for chainName/shortName when chain config is missing', () => {
    const unknownSafe: SafeItem = {
      chainId: '42161',
      address: '0xArb',
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: 'Arb Safe',
    }
    setupDefaults({ allSafes: [unknownSafe], safeAddress: '0xArb', currentChainId: '42161' })

    const { result } = renderHook(() => useSpaceChainSelector())
    expect(result.current.chains[0]).toMatchObject({
      chainId: '42161',
      chainName: '42161',
      shortName: '42161',
      chainLogoUri: null,
    })
  })

  it('fires CHAIN_SWITCHED trackEvent exactly once with correct params on chain change', () => {
    setupDefaults({ allSafes: [multiChainSafe], safeAddress: '0xSafe2' })

    const { result } = renderHook(() => useSpaceChainSelector())

    act(() => {
      result.current.handleChainChange('137')
    })

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.CHAIN_SWITCHED, label: '42' },
      {
        spaceId: '42',
        [MixpanelEventParams.SAFE_ADDRESS]: '0xSafe2',
        [MixpanelEventParams.CHAIN_ID]: '137',
      },
    )
  })
})
