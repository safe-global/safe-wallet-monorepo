import { renderHook, act } from '@testing-library/react'
import { useSpaceSafeSelectorItems } from './useSpaceSafeSelectorItems'
import type { SafeItem } from '@/hooks/safes/useAllSafes'
import type { MultiChainSafeItem } from '@/hooks/safes/useAllSafesGrouped'

// ── mocks ──────────────────────────────────────────────────────────────

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: jest.fn(),
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
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
jest.mock('@/store/api/gateway', () => ({
  useGetMultipleSafeOverviewsQuery: jest.fn(),
}))
jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))
jest.mock('@/store/settingsSlice', () => ({
  selectCurrency: jest.fn(),
}))
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/config/routes', () => ({
  AppRoutes: {
    home: '/home',
    spaces: {
      index: '/spaces',
      settings: '/spaces/settings',
      members: '/spaces/members',
      safeAccounts: '/spaces/safe-accounts',
      addressBook: '/spaces/address-book',
    },
    welcome: { spaces: '/welcome/spaces' },
  },
}))

import { useSpaceSafes, useCurrentSpaceId } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import useWallet from '@/hooks/wallets/useWallet'
import { useRouter } from 'next/router'

// ── helpers ────────────────────────────────────────────────────────────

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

const unnamedSafe: SafeItem = {
  chainId: '1',
  address: '0xUnnamed',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
}

const chainConfigs = [
  { chainId: '1', chainName: 'Ethereum', chainLogoUri: 'eth.png', shortName: 'eth' },
  { chainId: '137', chainName: 'Polygon', chainLogoUri: 'polygon.png', shortName: 'matic' },
]

const mockPush = jest.fn()

function setupDefaults(
  overrides: {
    allSafes?: Array<SafeItem | MultiChainSafeItem>
    safeAddress?: string
    currentChainId?: string
    spaceId?: string | null
    overviews?: Array<{
      address: { value: string }
      chainId: string
      fiatTotal: string
      threshold: number
      owners: { value: string }[]
    }>
    overviewsLoading?: boolean
    overviewsError?: boolean
  } = {},
) {
  ;(useSpaceSafes as jest.Mock).mockReturnValue({
    allSafes: overrides.allSafes ?? [singleChainSafe],
  })
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue(overrides.spaceId ?? '42')
  ;(useSafeInfo as jest.Mock).mockReturnValue({
    safe: { threshold: 2, owners: [{ value: '0xOwner1' }, { value: '0xOwner2' }] },
    safeAddress: overrides.safeAddress ?? '0xSafe1',
  })
  ;(useChainId as jest.Mock).mockReturnValue(overrides.currentChainId ?? '1')
  ;(useChains as jest.Mock).mockReturnValue({ configs: chainConfigs })
  ;(useGetMultipleSafeOverviewsQuery as jest.Mock).mockReturnValue({
    data: overrides.overviews ?? [
      { address: { value: '0xSafe1' }, chainId: '1', fiatTotal: '5000', threshold: 2, owners: [{ value: '0xOwner1' }] },
    ],
    isLoading: overrides.overviewsLoading ?? false,
    isError: overrides.overviewsError ?? false,
    refetch: jest.fn(),
  })
  ;(useAppSelector as jest.Mock).mockReturnValue('usd')
  ;(useWallet as jest.Mock).mockReturnValue({ address: '0xWallet' })
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
}

// ── tests ──────────────────────────────────────────────────────────────

describe('useSpaceSafeSelectorItems', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    setupDefaults()
  })

  // ── items populated from space safes ──

  it('returns items populated from user space safes', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({
      id: '1:0xSafe1',
      name: 'My Safe',
      address: '0xSafe1',
    })
  })

  it('sets the selectedItemId to currentChainId:safeAddress', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.selectedItemId).toBe('1:0xSafe1')
  })

  // ── unnamed safe shows empty name (address display handled by UI) ──

  it('uses empty string for name when safe has no name', () => {
    setupDefaults({
      allSafes: [unnamedSafe],
      safeAddress: '0xUnnamed',
      overviews: [
        { address: { value: '0xUnnamed' }, chainId: '1', fiatTotal: '100', threshold: 1, owners: [{ value: '0xO' }] },
      ],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].name).toBe('')
    expect(result.current.items[0].address).toBe('0xUnnamed')
  })

  // ── multi-chain safe ──

  it('returns multi-chain safe with all chains and aggregated balance', () => {
    setupDefaults({
      allSafes: [multiChainSafe],
      safeAddress: '0xSafe2',
      currentChainId: '1',
      overviews: [
        {
          address: { value: '0xSafe2' },
          chainId: '1',
          fiatTotal: '3000',
          threshold: 2,
          owners: [{ value: '0xO1' }, { value: '0xO2' }],
        },
        {
          address: { value: '0xSafe2' },
          chainId: '137',
          fiatTotal: '2000',
          threshold: 2,
          owners: [{ value: '0xO1' }, { value: '0xO2' }],
        },
      ],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    const item = result.current.items[0]

    expect(item.chains).toHaveLength(2)
    expect(item.chains[0].chainId).toBe('1') // current chain first
    expect(item.chains[1].chainId).toBe('137')
    // balance = sum of all chain balances
    expect(item.balance).toBe('5000')
  })

  it('places the current chainId first in chains list for selected multi-chain safe', () => {
    setupDefaults({
      allSafes: [multiChainSafe],
      safeAddress: '0xSafe2',
      currentChainId: '137',
      overviews: [
        { address: { value: '0xSafe2' }, chainId: '1', fiatTotal: '100', threshold: 1, owners: [{ value: '0xO' }] },
        { address: { value: '0xSafe2' }, chainId: '137', fiatTotal: '200', threshold: 1, owners: [{ value: '0xO' }] },
      ],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].chains[0].chainId).toBe('137')
  })

  // ── chain info with prefixes ──

  it('includes chain shortName (prefix) in chain info', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].chains[0]).toMatchObject({
      chainId: '1',
      chainName: 'Ethereum',
      shortName: 'eth',
    })
  })

  // ── balance and threshold from overview ──

  it('uses overview data for balance and threshold of non-current safes', () => {
    const otherSafe: SafeItem = {
      chainId: '1',
      address: '0xOther',
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: 'Other',
    }

    setupDefaults({
      allSafes: [singleChainSafe, otherSafe],
      safeAddress: '0xSafe1',
      overviews: [
        {
          address: { value: '0xSafe1' },
          chainId: '1',
          fiatTotal: '5000',
          threshold: 2,
          owners: [{ value: '0xO1' }, { value: '0xO2' }],
        },
        {
          address: { value: '0xOther' },
          chainId: '1',
          fiatTotal: '8000',
          threshold: 3,
          owners: [{ value: '0xO1' }, { value: '0xO2' }, { value: '0xO3' }],
        },
      ],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    const otherItem = result.current.items.find((i) => i.address === '0xOther')

    expect(otherItem?.balance).toBe('8000')
    expect(otherItem?.threshold).toBe(3)
    expect(otherItem?.owners).toBe(3)
  })

  // ── loading state ──

  it('marks items as loading when overviews are still loading', () => {
    setupDefaults({ overviewsLoading: true, overviews: [] as never[] })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].isLoading).toBe(true)
  })

  // ── error state ──

  it('returns isError=true when overview query fails', () => {
    setupDefaults({ overviewsError: true })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.isError).toBe(true)
  })

  // ── empty safes ──

  it('returns empty items when there are no safes in the space', () => {
    setupDefaults({ allSafes: [] })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items).toEqual([])
  })

  // ── selecting a safe triggers navigation ──

  it('navigates to the selected safe with chain prefix on item select', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())

    act(() => {
      result.current.handleItemSelect('1:0xNewSafe')
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/home',
      query: { safe: 'eth:0xNewSafe' },
    })
  })

  it('does not navigate when chain config is not found', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())

    act(() => {
      result.current.handleItemSelect('999:0xSafe1')
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  // ── chain change triggers navigation ──

  it('navigates to the same safe on a different chain when chain changes', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())

    act(() => {
      result.current.handleChainChange('137')
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/home',
      query: { safe: 'matic:0xSafe1' },
    })
  })

  it('does not navigate on chain change when chain config is not found', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())

    act(() => {
      result.current.handleChainChange('999')
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  // ── skipToken when no safes ──

  it('passes skipToken to overview query when there are no flat safes', () => {
    setupDefaults({ allSafes: [] })

    renderHook(() => useSpaceSafeSelectorItems())

    // When flatSafes is empty, useGetMultipleSafeOverviewsQuery is called with skipToken (Symbol)
    const queryArg = (useGetMultipleSafeOverviewsQuery as jest.Mock).mock.calls[0][0]
    expect(typeof queryArg).toBe('symbol')
  })

  // ── refetch is returned ──

  it('returns a refetch function from the hook', () => {
    const mockRefetch = jest.fn()
    ;(useGetMultipleSafeOverviewsQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.refetch).toBe(mockRefetch)
  })

  // ── multi-chain safe NOT current: original chain order preserved ──

  it('does not reorder chains for a multi-chain safe that is not the current safe', () => {
    setupDefaults({
      allSafes: [multiChainSafe],
      safeAddress: '0xDifferentSafe', // not the multi-chain safe
      currentChainId: '137',
      overviews: [
        { address: { value: '0xSafe2' }, chainId: '1', fiatTotal: '100', threshold: 1, owners: [{ value: '0xO' }] },
        { address: { value: '0xSafe2' }, chainId: '137', fiatTotal: '200', threshold: 1, owners: [{ value: '0xO' }] },
      ],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    // Original order from multiChainSafe.safes: ['1', '137']
    expect(result.current.items[0].chains[0].chainId).toBe('1')
    expect(result.current.items[0].chains[1].chainId).toBe('137')
  })

  // ── multi-chain safe NOT current: threshold/owners from overview ──

  it('uses overview threshold/owners for a multi-chain safe that is not the current safe', () => {
    setupDefaults({
      allSafes: [multiChainSafe],
      safeAddress: '0xDifferentSafe',
      overviews: [
        {
          address: { value: '0xSafe2' },
          chainId: '1',
          fiatTotal: '100',
          threshold: 4,
          owners: [{ value: '0x1' }, { value: '0x2' }, { value: '0x3' }, { value: '0x4' }],
        },
        {
          address: { value: '0xSafe2' },
          chainId: '137',
          fiatTotal: '200',
          threshold: 4,
          owners: [{ value: '0x1' }, { value: '0x2' }, { value: '0x3' }, { value: '0x4' }],
        },
      ],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].threshold).toBe(4)
    expect(result.current.items[0].owners).toBe(4)
  })

  // ── toChainInfo fallback when chain config not found ──

  it('falls back to chainId for chainName and shortName when chain config is missing', () => {
    const safeOnUnknownChain: SafeItem = {
      chainId: '42161',
      address: '0xArb',
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: 'Arb Safe',
    }

    setupDefaults({
      allSafes: [safeOnUnknownChain],
      safeAddress: '0xArb',
      currentChainId: '42161',
      overviews: [],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].chains[0]).toMatchObject({
      chainId: '42161',
      chainName: '42161',
      shortName: '42161',
      chainLogoUri: null,
    })
  })

  // ── single-chain safe balance fallback ──

  it('returns balance "0" for a single-chain safe with no overview data', () => {
    setupDefaults({ overviews: [] as never[] })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].balance).toBe('0')
  })

  // ── isLoading false when overview already loaded ──

  it('sets isLoading to false when overview data exists even if query is still loading', () => {
    setupDefaults({
      overviewsLoading: true,
      overviews: [
        {
          address: { value: '0xSafe1' },
          chainId: '1',
          fiatTotal: '5000',
          threshold: 2,
          owners: [{ value: '0xOwner1' }],
        },
      ],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].isLoading).toBe(false)
  })

  // ── current safe uses live safe info ──

  it('uses live safe threshold/owners for the currently viewed safe', () => {
    ;(useSafeInfo as jest.Mock).mockReturnValue({
      safe: {
        threshold: 5,
        owners: [{ value: '0x1' }, { value: '0x2' }, { value: '0x3' }, { value: '0x4' }, { value: '0x5' }],
      },
      safeAddress: '0xSafe1',
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items[0].threshold).toBe(5)
    expect(result.current.items[0].owners).toBe(5)
  })

  // ── case-insensitive address matching ──

  it('matches the current safe using case-insensitive address comparison', () => {
    const mixedCaseSafe: SafeItem = {
      chainId: '1',
      address: '0xAbCdEf',
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: 'Mixed Case',
    }

    ;(useSafeInfo as jest.Mock).mockReturnValue({
      safe: { threshold: 3, owners: [{ value: '0x1' }, { value: '0x2' }, { value: '0x3' }] },
      safeAddress: '0xabcdef', // lowercase vs mixed-case in item
    })
    ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: [mixedCaseSafe] })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    // Should use live safe.threshold (3) not overview, proving case-insensitive match worked
    expect(result.current.items[0].threshold).toBe(3)
    expect(result.current.items[0].owners).toBe(3)
  })

  // ── tracking:

  it('fires SAFE_SELECTED trackEvent exactly once with correct params on item select', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())

    act(() => {
      result.current.handleItemSelect('1:0xNewSafe')
    })

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.SAFE_SELECTED, label: '42' },
      {
        spaceId: '42',
        [MixpanelEventParams.SAFE_ADDRESS]: '0xNewSafe',
        [MixpanelEventParams.CHAIN_ID]: '1',
      },
    )
  })

  it('fires CHAIN_SWITCHED trackEvent exactly once with correct params on chain change', () => {
    const { result } = renderHook(() => useSpaceSafeSelectorItems())

    act(() => {
      result.current.handleChainChange('137')
    })

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.CHAIN_SWITCHED, label: '42' },
      {
        spaceId: '42',
        [MixpanelEventParams.SAFE_ADDRESS]: '0xSafe1',
        [MixpanelEventParams.CHAIN_ID]: '137',
      },
    )
  })

  // ── wallet is null ──

  it('does not crash when useWallet returns null', () => {
    ;(useWallet as jest.Mock).mockReturnValue(null)

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    expect(result.current.items).toHaveLength(1)
  })

  // ── multi-chain safe id uses currentChainId for current safe ──

  it('sets multi-chain safe id using currentChainId when it is the current safe', () => {
    setupDefaults({
      allSafes: [multiChainSafe],
      safeAddress: '0xSafe2',
      currentChainId: '137',
      overviews: [
        { address: { value: '0xSafe2' }, chainId: '1', fiatTotal: '100', threshold: 1, owners: [{ value: '0xO' }] },
        { address: { value: '0xSafe2' }, chainId: '137', fiatTotal: '200', threshold: 1, owners: [{ value: '0xO' }] },
      ],
    })

    const { result } = renderHook(() => useSpaceSafeSelectorItems())
    // id should start with currentChainId (137), not first chain in safes array (1)
    expect(result.current.items[0].id).toBe('137:0xSafe2')
  })
})
