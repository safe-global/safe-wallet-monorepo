import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as balancesQueries from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { balanceBuilder, balancesBuilder } from '@/tests/builders/balances'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import { useChain } from '@/hooks/useChains'
import { useTokenListSetting } from '@/hooks/loadables/useLoadBalances'
import { makeStore } from '@/store'
import { POPULAR_TOKENS } from '../../popularTokens'
import useSpendingLimitTokenOptions, { buildIdentityKey } from '../useSpendingLimitTokenOptions'

jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({
  ...jest.requireActual('@/hooks/useChains'),
  useChain: jest.fn(),
}))
jest.mock('@/hooks/loadables/useLoadBalances', () => ({
  ...jest.requireActual('@/hooks/loadables/useLoadBalances'),
  useTokenListSetting: jest.fn(),
}))

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>
const mockUseChain = useChain as jest.MockedFunction<typeof useChain>
const mockUseTokenListSetting = useTokenListSetting as jest.MockedFunction<typeof useTokenListSetting>

type QueryResult = ReturnType<typeof balancesQueries.useBalancesGetBalancesV1Query>

const queryResult = (overrides: Partial<QueryResult> = {}): QueryResult =>
  ({
    currentData: undefined,
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    isSuccess: false,
    isUninitialized: false,
    error: undefined,
    refetch: jest.fn(),
    ...overrides,
  }) as unknown as QueryResult

const CHAIN_ID = '1'
const safeAddress = checksumAddress(faker.finance.ethereumAddress())

const setSafe = (overrides: { deployed?: boolean; address?: string; chainId?: string } = {}) => {
  const safe = extendedSafeInfoBuilder()
    .with({ chainId: overrides.chainId ?? CHAIN_ID, deployed: overrides.deployed ?? true })
    .build()
  mockUseSafeInfo.mockReturnValue({
    safe,
    safeAddress: overrides.address ?? safeAddress,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  })
}

describe('buildIdentityKey', () => {
  it('joins chainId and address, and is empty without an address', () => {
    expect(buildIdentityKey('1', safeAddress)).toBe(`1:${safeAddress}`)
    expect(buildIdentityKey('1', '')).toBe('')
  })
})

describe('useSpendingLimitTokenOptions', () => {
  let querySpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChainId.mockReturnValue(CHAIN_ID)
    mockUseChain.mockReturnValue(chainBuilder().with({ chainId: CHAIN_ID, features: [] }).build())
    mockUseTokenListSetting.mockReturnValue(true)
    setSafe()
    querySpy = jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue(queryResult())
  })

  it('queries the Transaction Service balances for the current Safe with the trusted setting', () => {
    const settings = { ...makeStore().getState().settings, currency: 'chf' }
    renderHook(() => useSpendingLimitTokenOptions(), {
      initialReduxState: { settings },
    })

    expect(querySpy).toHaveBeenCalledWith(
      { chainId: CHAIN_ID, safeAddress, fiatCode: 'chf', trusted: true },
      expect.objectContaining({ skip: false }),
    )
  })

  it('skips the query for an undeployed Safe', () => {
    setSafe({ deployed: false })

    renderHook(() => useSpendingLimitTokenOptions())

    expect(querySpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })

  it('skips the query when there is no Safe address or the token-list setting is unresolved', () => {
    setSafe({ address: '' })
    renderHook(() => useSpendingLimitTokenOptions())
    expect(querySpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ skip: true }))

    setSafe()
    mockUseTokenListSetting.mockReturnValue(undefined)
    renderHook(() => useSpendingLimitTokenOptions())
    expect(querySpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })

  it('skips the query and reports an empty identity while the Safe chain has not caught up with useChainId (mid-navigation)', () => {
    // The stored Safe is still on chain '1' while useChainId already reports '137' — the render
    // between navigating from Safe A (chain 1) to Safe B (chain 137).
    setSafe({ chainId: '1' })
    mockUseChainId.mockReturnValue('137')

    const { result } = renderHook(() => useSpendingLimitTokenOptions())

    expect(querySpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
    expect(result.current.identityKey).toBe('')
    expect(result.current.isLoading).toBe(false)
  })

  it('merges held balances with the chain popular list and native currency', () => {
    const held = balanceBuilder().build()
    querySpy.mockReturnValue(
      queryResult({
        currentData: balancesBuilder()
          .with({ items: [held] })
          .build(),
      }),
    )

    const { result } = renderHook(() => useSpendingLimitTokenOptions())

    const addresses = result.current.options.map((option) => option.address)
    expect(addresses[0]).toBe(held.tokenInfo.address)
    expect(addresses).toContain(ZERO_ADDRESS)
    for (const token of POPULAR_TOKENS[CHAIN_ID]) {
      expect(addresses).toContain(token.address)
    }
    expect(result.current.identityKey).toBe(`${CHAIN_ID}:${safeAddress}`)
  })

  it('offers only the native currency plus popular tokens for an undeployed Safe', () => {
    setSafe({ deployed: false })

    const { result } = renderHook(() => useSpendingLimitTokenOptions())

    expect(result.current.options.every((option) => option.group === 'popular')).toBe(true)
    expect(result.current.options.map((option) => option.address)).toContain(ZERO_ADDRESS)
  })

  it('omits the native currency on HIDE_NATIVE_TOKEN chains', () => {
    mockUseChain.mockReturnValue(
      chainBuilder()
        .with({ chainId: CHAIN_ID, features: [FEATURES.HIDE_NATIVE_TOKEN] })
        .build(),
    )

    const { result } = renderHook(() => useSpendingLimitTokenOptions())

    expect(result.current.options.some((option) => option.address === ZERO_ADDRESS)).toBe(false)
  })

  it('returns an empty popular list on a chain outside the table', () => {
    mockUseChainId.mockReturnValue('999')
    mockUseChain.mockReturnValue(chainBuilder().with({ chainId: '999', features: [] }).build())

    const { result } = renderHook(() => useSpendingLimitTokenOptions())

    expect(result.current.options.map((option) => option.address)).toEqual([ZERO_ADDRESS])
  })

  it('reports loading only while there is no data yet', () => {
    querySpy.mockReturnValue(queryResult({ isLoading: true }))
    expect(renderHook(() => useSpendingLimitTokenOptions()).result.current.isLoading).toBe(true)

    querySpy.mockReturnValue(queryResult({ isFetching: true, currentData: balancesBuilder().build() }))
    expect(renderHook(() => useSpendingLimitTokenOptions()).result.current.isLoading).toBe(false)
  })

  it('reports loading while the token-list setting is unresolved for a deployed Safe', () => {
    mockUseTokenListSetting.mockReturnValue(undefined)

    const { result } = renderHook(() => useSpendingLimitTokenOptions())

    expect(querySpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  it('never reports loading or error while the query is skipped', () => {
    setSafe({ deployed: false })
    querySpy.mockReturnValue(queryResult({ isLoading: true, isError: true }))

    const { result } = renderHook(() => useSpendingLimitTokenOptions())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('passes through the error flag and refetch', () => {
    const refetch = jest.fn()
    querySpy.mockReturnValue(queryResult({ isError: true, refetch }))

    const { result } = renderHook(() => useSpendingLimitTokenOptions())

    expect(result.current.isError).toBe(true)
    result.current.refetch()
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
