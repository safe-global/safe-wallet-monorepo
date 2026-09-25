import { renderHook, waitFor } from '@/tests/test-utils'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { AllSafeItems, SafeItem } from '@/hooks/safes'
import { PendingSafeStatus, type UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { RootState } from '@/store'
// Spied, not module-mocked: `@/store` builds the real store from `gatewayApi`, and a `requireActual`
// round-trip through this barrel re-enters the safeOverviews ↔ index cycle.
import * as gatewayApi from '@/store/api/gateway'
import { useEligibleSafeAccounts } from './useEligibleSafeAccounts'
import { isSafeAccountGroup, type SafeAccountEntry, type SafeAccountOption } from '../types'

const mockUseSpaceSafes = jest.fn()
const mockUseGetMultipleSafeOverviewsQuery = jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery')
const mockUseGetProposerSafesQuery = jest.spyOn(gatewayApi, 'useGetProposerSafesQuery')
const mockUseWallet = jest.fn()

type OverviewsQueryResult = ReturnType<typeof gatewayApi.useGetMultipleSafeOverviewsQuery>
type ProposerSafesQueryResult = ReturnType<typeof gatewayApi.useGetProposerSafesQuery>

jest.mock('../../../../hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => mockUseSpaceSafes(),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
      { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
      { chainId: '11155111', chainName: 'Sepolia', chainLogoUri: null, shortName: 'sep' },
    ],
  }),
}))

const WALLET = '0x1111111111111111111111111111111111111111'
const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SAFE_B = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'

const safeItem = (chainId: string, address: string, isReadOnly: boolean, name?: string): SafeItem => ({
  chainId,
  address,
  isReadOnly,
  isPinned: false,
  lastVisited: 0,
  name,
})

const overview = (
  chainId: string,
  address: string,
  { threshold = 3, ownerCount = 5, fiatTotal = '0' } = {},
): SafeOverview => ({
  address: { value: address },
  chainId,
  threshold,
  owners: Array.from({ length: ownerCount }, (_, index) => ({ value: `0x${String(index).padStart(40, '0')}` })),
  fiatTotal,
  queued: 0,
})

const mockSpaceSafes = (allSafes: AllSafeItems, extra: Record<string, unknown> = {}) =>
  mockUseSpaceSafes.mockReturnValue({
    allSafes,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...extra,
  })

const mockOverviews = (data: SafeOverview[] | undefined, extra: Record<string, unknown> = {}) =>
  mockUseGetMultipleSafeOverviewsQuery.mockReturnValue({
    data,
    currentData: data,
    isError: false,
    isUninitialized: false,
    refetch: jest.fn(),
    ...extra,
  } as unknown as OverviewsQueryResult)

const mockProposerSafes = (data: Record<string, string[]> | undefined, extra: Record<string, unknown> = {}) =>
  mockUseGetProposerSafesQuery.mockReturnValue({
    data,
    currentData: data,
    isError: false,
    isUninitialized: false,
    refetch: jest.fn(),
    ...extra,
  } as unknown as ProposerSafesQueryResult)

describe('useEligibleSafeAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: WALLET })
    mockSpaceSafes([])
    mockOverviews([])
    mockProposerSafes({})
  })

  it('includes a Safe the wallet signs for', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false, 'Treasury')])
    mockOverviews([overview('1', SAFE_A)])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(result.current.accounts[0]).toMatchObject({
      id: `1:${SAFE_A}`,
      chainId: '1',
      address: SAFE_A,
      name: 'Treasury',
      eligibility: 'signer',
    })
  })

  it('includes a Safe the wallet only proposes for', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, true)])
    mockOverviews([overview('1', SAFE_A)])
    mockProposerSafes({ '1': [SAFE_A] })

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(result.current.accounts[0]).toMatchObject({ eligibility: 'proposer' })
  })

  it('marks a Safe the wallet both signs and proposes for', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews([overview('1', SAFE_A)])
    mockProposerSafes({ '1': [SAFE_A] })

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(result.current.accounts[0]).toMatchObject({ eligibility: 'signer-and-proposer' })
  })

  it('matches proposer safes case-insensitively', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, true)])
    mockOverviews([overview('1', SAFE_A)])
    mockProposerSafes({ '1': [SAFE_A.toLowerCase()] })

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
  })

  it('leaves out a Safe the wallet neither signs nor proposes for', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, true), safeItem('1', SAFE_B, false)])
    mockOverviews([overview('1', SAFE_A), overview('1', SAFE_B)])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(result.current.accounts[0].address).toBe(SAFE_B)
  })

  const undeployedSafe: UndeployedSafe = {
    status: { status: PendingSafeStatus.AWAITING_EXECUTION, type: PayMethod.PayLater },
    props: {
      factoryAddress: '0x0000000000000000000000000000000000000001',
      masterCopy: '0x0000000000000000000000000000000000000002',
      safeAccountConfig: {
        threshold: 1,
        owners: [WALLET],
        fallbackHandler: '0x0000000000000000000000000000000000000003',
        to: '0x0000000000000000000000000000000000000000',
        data: '0x',
        paymentReceiver: '0x0000000000000000000000000000000000000000',
      },
      saltNonce: '0',
      safeVersion: '1.4.1',
    },
  }

  const undeployedState = (chainId: string, address: string): Pick<RootState, 'undeployedSafes'> => ({
    undeployedSafes: { [chainId]: { [address]: undeployedSafe } },
  })

  const asOption = (entry: SafeAccountEntry): SafeAccountOption => {
    if (isSafeAccountGroup(entry)) throw new Error('expected a flat row')
    return entry
  }

  it('marks a counterfactual Safe as not activated', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false, 'Treasury')])
    mockOverviews([overview('1', SAFE_A)])

    const { result } = renderHook(() => useEligibleSafeAccounts(), {
      initialReduxState: undeployedState('1', SAFE_A),
    })

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(asOption(result.current.accounts[0]).ineligibleReason).toBe('not-activated')
  })

  it('leaves a deployed Safe pickable', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false, 'Treasury')])
    mockOverviews([overview('1', SAFE_A)])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(asOption(result.current.accounts[0]).ineligibleReason).toBeUndefined()
  })

  it('marks only the chains a multi-chain Safe is counterfactual on', async () => {
    mockSpaceSafes([
      {
        address: SAFE_A,
        name: 'Ops',
        isPinned: false,
        lastVisited: 0,
        safes: [safeItem('1', SAFE_A, false, 'Ops'), safeItem('137', SAFE_A, false, 'Ops')],
      },
    ])
    mockOverviews([overview('1', SAFE_A), overview('137', SAFE_A)])

    const { result } = renderHook(() => useEligibleSafeAccounts(), {
      initialReduxState: undeployedState('137', SAFE_A),
    })

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    const [entry] = result.current.accounts
    if (!isSafeAccountGroup(entry)) throw new Error('expected a group')
    expect(entry.accounts.map(({ chainId, ineligibleReason }) => ({ chainId, ineligibleReason }))).toEqual([
      { chainId: '1', ineligibleReason: undefined },
      { chainId: '137', ineligibleReason: 'not-activated' },
    ])
  })

  it('populates the threshold and owner count from the overviews', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews([overview('1', SAFE_A, { threshold: 2, ownerCount: 4 })])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(result.current.accounts[0]).toMatchObject({ threshold: 2, owners: 4 })
  })

  it('groups a multi-chain Safe by the chains it is actually eligible on', async () => {
    mockSpaceSafes([
      {
        address: SAFE_A,
        name: 'Ops',
        isPinned: false,
        lastVisited: 0,
        safes: [
          safeItem('1', SAFE_A, false, 'Ops'),
          safeItem('137', SAFE_A, false, 'Ops'),
          safeItem('11155111', SAFE_A, true, 'Ops'),
        ],
      },
    ])
    mockOverviews([overview('1', SAFE_A), overview('137', SAFE_A), overview('11155111', SAFE_A)])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    const [entry] = result.current.accounts
    if (!isSafeAccountGroup(entry)) throw new Error('expected a group')
    expect(entry.accounts.map((account) => account.chainId)).toEqual(['1', '137'])
  })

  it('collapses a multi-chain Safe eligible on a single chain into a flat row', async () => {
    mockSpaceSafes([
      {
        address: SAFE_A,
        name: 'Ops',
        isPinned: false,
        lastVisited: 0,
        safes: [
          safeItem('1', SAFE_A, false, 'Ops'),
          safeItem('137', SAFE_A, true, 'Ops'),
          safeItem('11155111', SAFE_A, true, 'Ops'),
        ],
      },
    ])
    mockOverviews([overview('1', SAFE_A)])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(isSafeAccountGroup(result.current.accounts[0])).toBe(false)
  })

  it('carries the fiat balance from the overview onto the option', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews([overview('1', SAFE_A, { fiatTotal: '1234.56' })])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(result.current.accounts[0]).toMatchObject({ fiatTotal: '1234.56' })
  })

  it('resolves the chain config so rows can render the network without a second lookup', async () => {
    mockSpaceSafes([safeItem('137', SAFE_A, false)])
    mockOverviews([overview('137', SAFE_A)])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(result.current.accounts[0]).toMatchObject({ chain: expect.objectContaining({ chainName: 'Polygon' }) })
  })

  it('totals a multi-chain group balance across its eligible chains', async () => {
    mockSpaceSafes([
      {
        address: SAFE_A,
        name: 'Ops',
        isPinned: false,
        lastVisited: 0,
        safes: [safeItem('1', SAFE_A, false, 'Ops'), safeItem('137', SAFE_A, false, 'Ops')],
      },
    ])
    mockOverviews([overview('1', SAFE_A, { fiatTotal: '1000' }), overview('137', SAFE_A, { fiatTotal: '250.5' })])

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    const [entry] = result.current.accounts
    if (!isSafeAccountGroup(entry)) throw new Error('expected a group')
    expect(entry.fiatTotal).toBe('1250.5')
  })

  it('asks for proposer status once per distinct chain, not once per Safe', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false), safeItem('1', SAFE_B, false), safeItem('137', SAFE_A, false)])
    mockOverviews([overview('1', SAFE_A), overview('1', SAFE_B), overview('137', SAFE_A)])

    renderHook(() => useEligibleSafeAccounts())

    expect(mockUseGetProposerSafesQuery).toHaveBeenCalledWith({ chainIds: ['1', '137'], delegate: WALLET })
  })

  it('subscribes to the overviews with the args the Space dashboard uses, to share its cache entry', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews([overview('1', SAFE_A)])

    renderHook(() => useEligibleSafeAccounts())

    expect(mockUseGetMultipleSafeOverviewsQuery).toHaveBeenCalledWith({
      safes: [{ chainId: '1', address: SAFE_A }],
      currency: 'usd',
    })
  })

  it('still returns signer accounts when the delegates request fails', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews([overview('1', SAFE_A)])
    mockProposerSafes(undefined, { isError: true })

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('reports an error when the overviews request fails', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews(undefined, { isError: true })

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.isLoading).toBe(false)
  })

  it('reports an error when the Space safes request fails', async () => {
    mockSpaceSafes([], { isError: true })

    const { result } = renderHook(() => useEligibleSafeAccounts())

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('returns nothing and skips the proposer query when no wallet is connected', async () => {
    mockUseWallet.mockReturnValue(null)
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews(undefined)

    const { result } = renderHook(() => useEligibleSafeAccounts())

    expect(result.current.accounts).toEqual([])
    expect(result.current.hasWallet).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(mockUseGetProposerSafesQuery).toHaveBeenCalledWith(skipToken)
  })

  it('stays loading until the overviews resolve, so the list never flashes empty', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, true)])
    mockOverviews(undefined)

    const { result } = renderHook(() => useEligibleSafeAccounts())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.accounts).toEqual([])
  })

  it('stays loading until proposer status resolves', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, true)])
    mockOverviews([overview('1', SAFE_A)])
    mockProposerSafes(undefined)

    const { result } = renderHook(() => useEligibleSafeAccounts())

    expect(result.current.isLoading).toBe(true)
  })

  it('ignores the previous wallet’s proposer result while the new one is in flight', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, true)])
    mockOverviews([overview('1', SAFE_A)])
    mockProposerSafes({ '1': [SAFE_A] }, { currentData: undefined })

    const { result } = renderHook(() => useEligibleSafeAccounts())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.accounts).toEqual([])
  })

  it('ignores the previous args’ overviews while the new ones are in flight', async () => {
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews([overview('1', SAFE_A)], { currentData: undefined })

    const { result } = renderHook(() => useEligibleSafeAccounts())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.accounts).toEqual([])
  })

  it('refetches the Space safes and both derived queries', async () => {
    const refetchSafes = jest.fn()
    const refetchOverviews = jest.fn()
    const refetchProposed = jest.fn()
    mockSpaceSafes([safeItem('1', SAFE_A, false)], { refetch: refetchSafes })
    mockOverviews([overview('1', SAFE_A)], { refetch: refetchOverviews })
    mockProposerSafes({}, { refetch: refetchProposed })

    const { result } = renderHook(() => useEligibleSafeAccounts())
    result.current.refetch()

    expect(refetchSafes).toHaveBeenCalled()
    expect(refetchOverviews).toHaveBeenCalled()
    expect(refetchProposed).toHaveBeenCalled()
  })

  it('does not refetch the Space safes when that query never started', async () => {
    const refetchSafes = jest.fn()
    mockSpaceSafes([safeItem('1', SAFE_A, false)], { refetch: refetchSafes, isUninitialized: true })
    mockOverviews([overview('1', SAFE_A)])

    const { result } = renderHook(() => useEligibleSafeAccounts())
    result.current.refetch()

    expect(refetchSafes).not.toHaveBeenCalled()
  })

  it('does not refetch a query that never started', async () => {
    const refetchProposed = jest.fn()
    mockSpaceSafes([safeItem('1', SAFE_A, false)])
    mockOverviews([overview('1', SAFE_A)])
    mockProposerSafes(undefined, { isUninitialized: true, refetch: refetchProposed })

    const { result } = renderHook(() => useEligibleSafeAccounts())
    result.current.refetch()

    expect(refetchProposed).not.toHaveBeenCalled()
  })
})
