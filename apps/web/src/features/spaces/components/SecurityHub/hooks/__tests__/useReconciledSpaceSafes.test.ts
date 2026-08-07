import { renderHook } from '@testing-library/react'
import useReconciledSpaceSafes from '../useReconciledSpaceSafes'

const useSpaceSafesMock = jest.fn()
const useGetMultipleSafeOverviewsQueryMock = jest.fn()
const useAppSelectorMock = jest.fn()

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: () => useSpaceSafesMock(),
}))

jest.mock('@/store', () => ({
  useAppSelector: (selector: unknown) => useAppSelectorMock(selector),
}))

jest.mock('@/store/slices', () => ({
  selectUndeployedSafes: 'selectUndeployedSafes',
  selectCurrency: 'selectCurrency',
}))

jest.mock('@/store/api/gateway', () => ({
  useGetMultipleSafeOverviewsQuery: (...args: unknown[]) => useGetMultipleSafeOverviewsQueryMock(...args),
}))

const SAFE_A = '0xA000000000000000000000000000000000000000'
const SAFE_B = '0xB000000000000000000000000000000000000000'
const MAINNET = '1'
const POLYGON = '137'

const mkSecurity = (isReady = true) =>
  ({
    $isReady: isReady,
    scanKey: (address: string, chainId: string) => `${address}:${chainId}`,
  }) as unknown as Parameters<typeof useReconciledSpaceSafes>[0]

const mkOverview = (address: string, chainId: string, fiatTotal = '1000', queued = 0) => ({
  address: { value: address },
  chainId,
  fiatTotal,
  queued,
})

const setSelectors = ({ undeployed = {}, currency = 'usd' } = {}) => {
  useAppSelectorMock.mockImplementation((selector: string) => {
    if (selector === 'selectUndeployedSafes') return undeployed
    if (selector === 'selectCurrency') return currency
    return undefined
  })
}

describe('useReconciledSpaceSafes', () => {
  beforeEach(() => {
    useSpaceSafesMock.mockReset()
    useGetMultipleSafeOverviewsQueryMock.mockReset()
    useAppSelectorMock.mockReset()

    useSpaceSafesMock.mockReturnValue({ allSafes: [], isLoading: false })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({ data: undefined })
    setSelectors()
  })

  it('returns empty result when no Safes are present', () => {
    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    expect(result.current.safes).toEqual([])
    expect(result.current.deployedEntries).toEqual([])
    expect(result.current.balanceMap).toEqual({})
    expect(result.current.overviewMap).toEqual({})
  })

  it('skips the batch overview query when there are no deployed Safes to fetch', () => {
    renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    expect(useGetMultipleSafeOverviewsQueryMock).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('builds balanceMap and overviewMap from the batch overview response', () => {
    useSpaceSafesMock.mockReturnValue({
      allSafes: [{ chainId: MAINNET, address: SAFE_A, name: 'A' }],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({
      data: [mkOverview(SAFE_A, MAINNET, '1234', 5)],
    })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    const key = `${SAFE_A}:${MAINNET}`
    expect(result.current.balanceMap).toEqual({ [key]: '1234' })
    expect(result.current.overviewMap).toEqual({ [key]: { balanceUsd: 1234, queuedTxCount: 5 } })
  })

  it('keeps an undeployed single-chain Safe out of deployedEntries but in safes', () => {
    setSelectors({ undeployed: { [MAINNET]: { [SAFE_A]: { props: {} } } } })
    useSpaceSafesMock.mockReturnValue({
      allSafes: [{ chainId: MAINNET, address: SAFE_A, name: 'A' }],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({ data: [] })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    expect(result.current.safes).toHaveLength(1)
    expect(result.current.safes[0].chainEntries[0].isDeployed).toBe(false)
    expect(result.current.deployedEntries).toEqual([])
  })

  it('demotes ghost-deployed multichain entries when CGW does not confirm them', () => {
    useSpaceSafesMock.mockReturnValue({
      allSafes: [
        {
          address: SAFE_A,
          safes: [
            { chainId: MAINNET, address: SAFE_A },
            { chainId: POLYGON, address: SAFE_A },
          ],
          isPinned: false,
          lastVisited: 0,
          name: 'Multi A',
        },
      ],
      isLoading: false,
    })
    // CGW only returns Mainnet — Polygon is ghost-deployed.
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({
      data: [mkOverview(SAFE_A, MAINNET)],
    })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    const reconciled = result.current.safes[0]
    const mainnetEntry = reconciled.chainEntries.find((c) => c.chainId === MAINNET)
    const polygonEntry = reconciled.chainEntries.find((c) => c.chainId === POLYGON)
    expect(mainnetEntry?.isDeployed).toBe(true)
    expect(polygonEntry?.isDeployed).toBe(false)
    expect(result.current.deployedEntries).toEqual([{ address: SAFE_A, chainId: MAINNET }])
  })

  it('does not reconcile while CGW response is still loading (null confirmedDeployedKeys)', () => {
    useSpaceSafesMock.mockReturnValue({
      allSafes: [{ chainId: MAINNET, address: SAFE_A, name: 'A' }],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({ data: undefined })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    // Optimistic: Safe stays deployed since reconciliation is inconclusive.
    expect(result.current.safes[0].chainEntries[0].isDeployed).toBe(true)
    expect(result.current.deployedEntries).toEqual([{ address: SAFE_A, chainId: MAINNET }])
  })

  it('returns rawSafes unchanged when the security feature is not ready', () => {
    useSpaceSafesMock.mockReturnValue({
      allSafes: [{ chainId: MAINNET, address: SAFE_A, name: 'A' }],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({
      data: [mkOverview(SAFE_A, MAINNET)],
    })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity(false)))

    expect(result.current.balanceMap).toEqual({})
    expect(result.current.overviewMap).toEqual({})
    expect(result.current.safes[0].chainEntries[0].isDeployed).toBe(true)
  })

  it('forwards isLoadingSpacesSafes from useSpaceSafes', () => {
    useSpaceSafesMock.mockReturnValue({ allSafes: [], isLoading: true })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    expect(result.current.isLoadingSpacesSafes).toBe(true)
  })

  it('reports isLoadingOverviews while the batch query has no response yet', () => {
    useSpaceSafesMock.mockReturnValue({
      allSafes: [{ chainId: MAINNET, address: SAFE_A, name: 'A' }],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({ data: undefined })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    expect(result.current.isLoadingOverviews).toBe(true)
  })

  it('clears isLoadingOverviews once the batch response arrives', () => {
    useSpaceSafesMock.mockReturnValue({
      allSafes: [{ chainId: MAINNET, address: SAFE_A, name: 'A' }],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({ data: [mkOverview(SAFE_A, MAINNET)] })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    expect(result.current.isLoadingOverviews).toBe(false)
  })

  it('does not gate on overviews when there are no deployed Safes to fetch', () => {
    setSelectors({ undeployed: { [MAINNET]: { [SAFE_A]: { props: {} } } } })
    useSpaceSafesMock.mockReturnValue({
      allSafes: [{ chainId: MAINNET, address: SAFE_A, name: 'A' }],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({ data: undefined })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    // Query is skipped (nothing deployed) — no skeleton, render the undeployed rows.
    expect(result.current.isLoadingOverviews).toBe(false)
  })

  it('stops gating on overviews when the batch query errors', () => {
    useSpaceSafesMock.mockReturnValue({
      allSafes: [{ chainId: MAINNET, address: SAFE_A, name: 'A' }],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({ data: undefined, isError: true })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    expect(result.current.isLoadingOverviews).toBe(false)
  })

  it('ignores overview entries with missing address or chainId', () => {
    useSpaceSafesMock.mockReturnValue({
      allSafes: [
        { chainId: MAINNET, address: SAFE_A, name: 'A' },
        { chainId: MAINNET, address: SAFE_B, name: 'B' },
      ],
      isLoading: false,
    })
    useGetMultipleSafeOverviewsQueryMock.mockReturnValue({
      data: [
        mkOverview(SAFE_A, MAINNET, '500'),
        { address: undefined, chainId: MAINNET, fiatTotal: '999', queued: 0 },
        { address: { value: SAFE_B }, chainId: undefined, fiatTotal: '888', queued: 0 },
      ],
    })

    const { result } = renderHook(() => useReconciledSpaceSafes(mkSecurity()))

    expect(result.current.balanceMap).toEqual({ [`${SAFE_A}:${MAINNET}`]: '500' })
  })
})
