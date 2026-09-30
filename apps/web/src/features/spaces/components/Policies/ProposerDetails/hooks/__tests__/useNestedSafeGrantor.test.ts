import { renderHook, waitFor } from '@testing-library/react'
import { MOCK_ADDRESSES } from '../../../mocks/policies'
import { useNestedSafeGrantor } from '../useNestedSafeGrantor'

const mockIsSmartContractWallet = jest.fn()
const mockUseChain = jest.fn()
const mockProvider = {}
const PARENT_SAFE = '0x2222222222222222222222222222222222222222'

jest.mock('@/utils/wallets', () => ({
  isSmartContractWallet: (...args: unknown[]) => mockIsSmartContractWallet(...args),
}))

jest.mock('@/hooks/useChains', () => ({
  useChain: () => mockUseChain(),
}))

jest.mock('@/hooks/wallets/web3', () => ({
  createWeb3ReadOnly: () => mockProvider,
}))

const proposer = {
  proposer: MOCK_ADDRESSES.bob,
  delegatedBy: [
    { delegator: MOCK_ADDRESSES.alice, label: 'Bob' },
    { delegator: PARENT_SAFE, label: 'Bob' },
  ],
}

describe('useNestedSafeGrantor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChain.mockReturnValue({ chainId: '1' })
    mockIsSmartContractWallet.mockImplementation(async (_chainId: string, address: string) => address === PARENT_SAFE)
  })

  it('should return the delegator that is a contract', async () => {
    const { result } = renderHook(() => useNestedSafeGrantor('1', proposer))

    await waitFor(() => expect(result.current).toBe(PARENT_SAFE))
    expect(mockIsSmartContractWallet).toHaveBeenCalledWith('1', PARENT_SAFE, mockProvider)
  })

  it('should return nothing when every delegator is an EOA', async () => {
    mockIsSmartContractWallet.mockResolvedValue(false)

    const { result } = renderHook(() => useNestedSafeGrantor('1', proposer))

    await waitFor(() => expect(mockIsSmartContractWallet).toHaveBeenCalledTimes(2))
    expect(result.current).toBeUndefined()
  })

  it('should treat a delegator whose code cannot be read as an EOA', async () => {
    mockIsSmartContractWallet.mockImplementation(async (_chainId: string, address: string) => {
      if (address === MOCK_ADDRESSES.alice) throw new Error('RPC down')
      return address === PARENT_SAFE
    })

    const { result } = renderHook(() => useNestedSafeGrantor('1', proposer))

    await waitFor(() => expect(result.current).toBe(PARENT_SAFE))
  })

  it('should not probe anything when the chain is unknown', () => {
    mockUseChain.mockReturnValue(undefined)

    const { result } = renderHook(() => useNestedSafeGrantor('1', proposer))

    expect(result.current).toBeUndefined()
    expect(mockIsSmartContractWallet).not.toHaveBeenCalled()
  })
})
