import { renderHook } from '@testing-library/react'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import { useSafeSignerCheck } from '../useSafeSignerCheck'

const WALLET = '0x000000000000000000000000000000000000a11c'
const NESTED_OWNER_SAFE = '0x00000000000000000000000000000000000000ff'

const makeSafe = (address: string, isReadOnly = true): SafeItem => ({
  chainId: '1',
  address,
  isReadOnly,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

const ownedSafe = makeSafe('0x0000000000000000000000000000000000000001', false)
const proposerSafe = makeSafe('0x0000000000000000000000000000000000000002')
const nestedSafe = makeSafe('0x0000000000000000000000000000000000000003')
const strangerSafe = makeSafe('0x0000000000000000000000000000000000000004')
const safes = [ownedSafe, proposerSafe, nestedSafe, strangerSafe]

const overview = (address: string, owners: string[]) => ({
  chainId: '1',
  address: { value: address },
  owners: owners.map((value) => ({ value })),
})

const overviews = [
  overview(ownedSafe.address, [WALLET]),
  overview(proposerSafe.address, ['0x0000000000000000000000000000000000000b0b']),
  overview(nestedSafe.address, [NESTED_OWNER_SAFE]),
  overview(strangerSafe.address, ['0x0000000000000000000000000000000000000b0b']),
]

type QueryState = { currentData?: unknown; isError?: boolean; isUninitialized?: boolean; isLoading?: boolean }

const mockUseWallet = jest.fn()
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1', features: [] }], loading: false }),
}))

const mockOverviewsQuery = jest.fn<QueryState, [unknown]>()
const mockProposerSafesQuery = jest.fn<QueryState, [unknown]>()
jest.mock('@/store/api/gateway', () => ({
  useGetMultipleSafeOverviewsQuery: (arg: unknown) => mockOverviewsQuery(arg),
  useGetProposerSafesQuery: (arg: unknown) => mockProposerSafesQuery(arg),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => 'USD',
}))

const mockOwnedSafesQuery = jest.fn<QueryState, [unknown]>()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/owners', () => ({
  useOwnersGetAllSafesByOwnerV2Query: (arg: unknown) => mockOwnedSafesQuery(arg),
}))

const renderCheck = (enabled = true) => renderHook(() => useSafeSignerCheck(safes, enabled)).result.current

describe('useSafeSignerCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: WALLET })
    mockOverviewsQuery.mockReturnValue({ currentData: overviews })
    mockProposerSafesQuery.mockReturnValue({ currentData: { '1': [proposerSafe.address] } })
    mockOwnedSafesQuery.mockReturnValue({ currentData: { '1': [NESTED_OWNER_SAFE] } })
  })

  it('resolves owners, proposers and nested-Safe owners as signers and others as not signers', () => {
    const getStatus = renderCheck()

    expect(getStatus(ownedSafe)).toBe('signer')
    expect(getStatus(proposerSafe)).toBe('signer')
    expect(getStatus(nestedSafe)).toBe('signer')
    expect(getStatus(strangerSafe)).toBe('not-signer')
  })

  it('enables an owned Safe right away while the other checks are pending', () => {
    mockProposerSafesQuery.mockReturnValue({})
    mockOwnedSafesQuery.mockReturnValue({ isLoading: true })

    const getStatus = renderCheck()

    expect(getStatus(ownedSafe)).toBe('signer')
    expect(getStatus(proposerSafe)).toBe('pending')
    expect(getStatus(strangerSafe)).toBe('pending')
  })

  it('keeps a nested-owner Safe pending while only the owned-Safes query is loading', () => {
    mockOwnedSafesQuery.mockReturnValue({ isLoading: true })

    const getStatus = renderCheck()

    expect(getStatus(proposerSafe)).toBe('pending')
    expect(getStatus(nestedSafe)).toBe('pending')
    expect(getStatus(strangerSafe)).toBe('pending')
  })

  it('treats a failed proposer query as no proposer role without blocking the list', () => {
    mockProposerSafesQuery.mockReturnValue({ isError: true })

    const getStatus = renderCheck()

    expect(getStatus(proposerSafe)).toBe('not-signer')
    expect(getStatus(nestedSafe)).toBe('signer')
  })

  it('treats a failed owned-Safes query as no nested-owner role', () => {
    mockOwnedSafesQuery.mockReturnValue({ isError: true })

    const getStatus = renderCheck()

    expect(getStatus(nestedSafe)).toBe('not-signer')
    expect(getStatus(proposerSafe)).toBe('signer')
  })

  it('makes one proposer request across the Space chains, keyed by the wallet', () => {
    renderCheck()

    expect(mockProposerSafesQuery).toHaveBeenCalledWith({ chains: [{ chainId: '1', features: [] }], delegate: WALLET })
    expect(mockOwnedSafesQuery).toHaveBeenCalledWith({ ownerAddress: WALLET })
  })

  it('skips the requests when disabled', () => {
    renderCheck(false)

    expect(mockProposerSafesQuery.mock.calls.every(([arg]) => typeof arg === 'symbol')).toBe(true)
    expect(mockOverviewsQuery.mock.calls.every(([arg]) => typeof arg === 'symbol')).toBe(true)
    expect(mockOwnedSafesQuery.mock.calls.every(([arg]) => typeof arg === 'symbol')).toBe(true)
  })

  it('goes back to pending on a wallet switch until the owned Safes of the new wallet load', () => {
    const WALLET_B = '0x000000000000000000000000000000000000b0b2'
    const { result, rerender } = renderHook(() => useSafeSignerCheck(safes, true))

    expect(result.current(nestedSafe)).toBe('signer')

    mockUseWallet.mockReturnValue({ address: WALLET_B })
    mockOwnedSafesQuery.mockReturnValue({ isLoading: true })
    rerender()

    expect(mockOwnedSafesQuery).toHaveBeenLastCalledWith({ ownerAddress: WALLET_B })
    expect(result.current(nestedSafe)).toBe('pending')

    mockOwnedSafesQuery.mockReturnValue({ currentData: { '1': [] } })
    rerender()

    expect(result.current(nestedSafe)).toBe('not-signer')
  })
})
