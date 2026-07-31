import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { AddressInfo, SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useSpaceSafeOverviews } from '../useSpaceSafeOverviews'

const mockUseGetMultipleSafeOverviewsQuery = jest.fn()
const mockUseWallet = jest.fn()
let mockCurrency = 'usd'

// The hook only reads `props.safeAccountConfig.owners`; keep the fixture minimal but typed.
type TestUndeployed = Record<string, Record<string, { props: { safeAccountConfig: { owners: string[] } } }>>
let mockUndeployedSafes: TestUndeployed = {}

jest.mock('@/store', () => ({
  useAppSelector: (selector: string) => {
    if (selector === 'selectCurrency') return mockCurrency
    if (selector === 'selectUndeployedSafes') return mockUndeployedSafes
    return undefined
  },
}))

jest.mock('@/store/settingsSlice', () => ({ selectCurrency: 'selectCurrency' }))
jest.mock('@/store/slices', () => ({ selectUndeployedSafes: 'selectUndeployedSafes' }))

jest.mock('@/store/api/gateway', () => ({
  useGetMultipleSafeOverviewsQuery: (...args: unknown[]) => mockUseGetMultipleSafeOverviewsQuery(...args),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

const addr = (value: string): AddressInfo => ({ value })

const buildOverview = (chainId: string, address: string, owners: string[]): SafeOverview => ({
  address: addr(address),
  chainId,
  threshold: 1,
  owners: owners.map(addr),
  fiatTotal: '0',
  queued: 0,
})

const WALLET = '0x1111111111111111111111111111111111111111'
const OTHER = '0x2222222222222222222222222222222222222222'
const SAFE_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const SAFE_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const mockOverviews = (data: SafeOverview[] | undefined) =>
  mockUseGetMultipleSafeOverviewsQuery.mockReturnValue({ data })

describe('useSpaceSafeOverviews', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrency = 'usd'
    mockUndeployedSafes = {}
    mockUseWallet.mockReturnValue({ address: WALLET })
    mockOverviews([])
  })

  it('skips the query (skipToken) when there are no space safes', () => {
    renderHook(() => useSpaceSafeOverviews([]))

    expect(mockUseGetMultipleSafeOverviewsQuery).toHaveBeenCalledWith(skipToken)
  })

  it('subscribes without walletAddress so the entry stays wallet-independent', () => {
    mockOverviews([buildOverview('1', SAFE_A, [WALLET])])

    renderHook(() => useSpaceSafeOverviews([{ chainId: '1', address: SAFE_A }]))

    expect(mockUseGetMultipleSafeOverviewsQuery).toHaveBeenCalledWith({
      safes: [{ chainId: '1', address: SAFE_A }],
      currency: 'usd',
    })
  })

  it('returns an empty map while overviews are loading (read-only, matches today)', () => {
    mockOverviews(undefined)

    const { result } = renderHook(() => useSpaceSafeOverviews([{ chainId: '1', address: SAFE_A }]))

    expect(result.current.ownedByChain).toEqual({})
    expect(result.current.isOwnershipResolved).toBe(false)
  })

  it('returns an empty map when the wallet is not connected', () => {
    mockUseWallet.mockReturnValue(null)
    mockOverviews([buildOverview('1', SAFE_A, [WALLET])])

    const { result } = renderHook(() => useSpaceSafeOverviews([{ chainId: '1', address: SAFE_A }]))

    expect(result.current.ownedByChain).toEqual({})
    expect(result.current.isOwnershipResolved).toBe(true)
  })

  it('returns an empty map when the wallet owns none of the safes', () => {
    mockOverviews([buildOverview('1', SAFE_A, [OTHER])])

    const { result } = renderHook(() => useSpaceSafeOverviews([{ chainId: '1', address: SAFE_A }]))

    expect(result.current.ownedByChain).toEqual({})
    expect(result.current.isOwnershipResolved).toBe(true)
  })

  it('maps only the safes the wallet owns, keyed by chain', () => {
    mockOverviews([buildOverview('1', SAFE_A, [WALLET]), buildOverview('1', SAFE_B, [OTHER])])

    const { result } = renderHook(() =>
      useSpaceSafeOverviews([
        { chainId: '1', address: SAFE_A },
        { chainId: '1', address: SAFE_B },
      ]),
    )

    expect(result.current.ownedByChain).toEqual({ '1': [SAFE_A] })
  })

  it('resolves ownership case-insensitively (F1)', () => {
    // Overview owner is checksummed/upper-case; the connected wallet is lower-case.
    mockUseWallet.mockReturnValue({ address: WALLET })
    mockOverviews([buildOverview('1', SAFE_A, [WALLET.toUpperCase()])])

    const { result } = renderHook(() => useSpaceSafeOverviews([{ chainId: '1', address: SAFE_A }]))

    expect(result.current.ownedByChain).toEqual({ '1': [SAFE_A] })
  })

  it('falls back to the counterfactual owner config for undeployed safes (F2)', () => {
    // No overview for the undeployed safe, but the wallet is a configured CF owner.
    mockOverviews([])
    mockUndeployedSafes = {
      '10': { [SAFE_B]: { props: { safeAccountConfig: { owners: [WALLET] } } } },
    }

    const { result } = renderHook(() => useSpaceSafeOverviews([{ chainId: '10', address: SAFE_B }]))

    expect(result.current.ownedByChain).toEqual({ '10': [SAFE_B] })
  })

  it('does not claim undeployed safes the wallet is not a CF owner of (F2)', () => {
    mockOverviews([])
    mockUndeployedSafes = {
      '10': { [SAFE_B]: { props: { safeAccountConfig: { owners: [OTHER] } } } },
    }

    const { result } = renderHook(() => useSpaceSafeOverviews([{ chainId: '10', address: SAFE_B }]))

    expect(result.current.ownedByChain).toEqual({})
  })

  it('leaves a safe read-only when its chain overview is missing (Edge Case B)', () => {
    // Two safes requested, only chain "1" came back; the chain "100" safe is unresolved → read-only.
    mockOverviews([buildOverview('1', SAFE_A, [WALLET])])

    const { result } = renderHook(() =>
      useSpaceSafeOverviews([
        { chainId: '1', address: SAFE_A },
        { chainId: '100', address: SAFE_B },
      ]),
    )

    expect(result.current.ownedByChain).toEqual({ '1': [SAFE_A] })
  })

  it('recomputes on wallet switch without changing the subscription args (no refetch)', () => {
    mockOverviews([buildOverview('1', SAFE_A, [WALLET])])

    const { result, rerender } = renderHook(() => useSpaceSafeOverviews([{ chainId: '1', address: SAFE_A }]))
    expect(result.current.ownedByChain).toEqual({ '1': [SAFE_A] })

    // Switch to a wallet that is not an owner.
    mockUseWallet.mockReturnValue({ address: OTHER })
    rerender()
    expect(result.current.ownedByChain).toEqual({})

    // Every subscription used the same wallet-independent args — walletAddress never entered the key.
    for (const call of mockUseGetMultipleSafeOverviewsQuery.mock.calls) {
      expect(call[0]).toEqual({ safes: [{ chainId: '1', address: SAFE_A }], currency: 'usd' })
    }
  })
})
