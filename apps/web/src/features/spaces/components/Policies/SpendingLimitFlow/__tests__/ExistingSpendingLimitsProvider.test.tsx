import type { ReactNode } from 'react'
import type { JsonRpcProvider } from 'ethers'
import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@/tests/test-utils'
import { useLoadFeature } from '@/features/__core__'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import type { SafeScope } from '@/components/tx-flow/safe-scope'
import { Errors, logError } from '@/services/exceptions'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { tokenOptionBuilder } from '../utils/tokenOptions.fixtures'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import { ExistingSpendingLimitsProvider, useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'

jest.mock('@/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))
jest.mock('../hooks/useSpendingLimitTokenOptions', () => ({ __esModule: true, default: jest.fn() }))

const mockUseSafeScope = useSafeScope as jest.MockedFunction<typeof useSafeScope>
const mockUseLoadFeature = useLoadFeature as jest.Mock
const mockUseOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>
const mockLoad = jest.fn()

const provider = { send: jest.fn() } as unknown as JsonRpcProvider
const usdc = tokenOptionBuilder().with({ symbol: 'USDC', decimals: 6 }).build()

const scopeFor = (safeAddress: string, modules = [addressExBuilder().build()]): SafeScope => ({
  chainId: '1',
  safeAddress,
  scopeKey: `1:${safeAddress}`,
  safeLoaded: true,
  safeLoading: false,
  safe: extendedSafeInfoBuilder().with({ chainId: '1', modules }).build(),
  web3ReadOnly: provider,
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <ExistingSpendingLimitsProvider>{children}</ExistingSpendingLimitsProvider>
)

describe('ExistingSpendingLimitsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLoadFeature.mockReturnValue({ $isReady: true, $isDisabled: false, loadSpendingLimits: mockLoad })
    mockUseOptions.mockReturnValue({
      options: [usdc],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isPopularLoading: false,
      isPopularError: false,
      refetchPopular: jest.fn(),
      identityKey: '',
    })
  })

  it('knows nothing outside the provider', () => {
    const { result } = renderHook(() => useExistingSpendingLimits())

    expect(result.current).toEqual({ loading: false })
  })

  it('loads nothing while no Safe is selected', () => {
    mockUseSafeScope.mockReturnValue(undefined)

    const { result } = renderHook(() => useExistingSpendingLimits(), { wrapper })

    expect(result.current.limits).toBeUndefined()
    expect(result.current.loading).toBe(false)
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it("loads the selected Safe's limits once with its own provider, modules and the known tokens", async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const scope = scopeFor(safeAddress)
    const limits = [spendingLimitStateBuilder().build()]
    mockUseSafeScope.mockReturnValue(scope)
    mockLoad.mockResolvedValue(limits)

    const { result } = renderHook(() => useExistingSpendingLimits(), { wrapper })

    await waitFor(() => expect(result.current.limits).toEqual(limits))
    expect(mockLoad).toHaveBeenCalledTimes(1)
    expect(mockLoad).toHaveBeenCalledWith(provider, scope.safe?.modules, safeAddress, '1', [
      expect.objectContaining({ address: usdc.address, symbol: 'USDC', decimals: 6, type: 'ERC20' }),
    ])
  })

  it('resolves an empty list for a Safe without modules, without asking the chain', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress(), []))

    const { result } = renderHook(() => useExistingSpendingLimits(), { wrapper })

    await waitFor(() => expect(result.current.limits).toEqual([]))
    expect(mockLoad).not.toHaveBeenCalled()
  })

  it('treats a loader that finds no module as an empty list', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    mockLoad.mockResolvedValue(undefined)

    const { result } = renderHook(() => useExistingSpendingLimits(), { wrapper })

    await waitFor(() => expect(result.current.limits).toEqual([]))
  })

  it('reloads when the selected Safe changes', async () => {
    const first = scopeFor(faker.finance.ethereumAddress())
    const second = scopeFor(faker.finance.ethereumAddress())
    mockUseSafeScope.mockReturnValue(first)
    mockLoad.mockResolvedValue([])

    const { result, rerender } = renderHook(() => useExistingSpendingLimits(), { wrapper })
    await waitFor(() => expect(result.current.limits).toEqual([]))

    mockUseSafeScope.mockReturnValue(second)
    rerender()

    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2))
    expect(mockLoad).toHaveBeenLastCalledWith(
      provider,
      second.safe?.modules,
      second.safeAddress,
      '1',
      expect.any(Array),
    )
  })

  it('logs and exposes a failed load, leaving the limits unknown', async () => {
    mockUseSafeScope.mockReturnValue(scopeFor(faker.finance.ethereumAddress()))
    const failure = new Error('rpc down')
    mockLoad.mockRejectedValue(failure)

    const { result } = renderHook(() => useExistingSpendingLimits(), { wrapper })

    await waitFor(() => expect(result.current.error).toBe(failure))
    expect(result.current.limits).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(Errors._609, failure, expect.anything())
  })
})
