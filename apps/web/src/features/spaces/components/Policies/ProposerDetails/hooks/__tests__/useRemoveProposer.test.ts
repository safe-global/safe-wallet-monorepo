import { act, renderHook } from '@testing-library/react'
import { asActivePolicy, MOCK_ADDRESSES, MOCK_SAFES, mockProposerPolicy } from '../../../mocks/policies'
import { useRemoveProposer } from '../useRemoveProposer'

const mockDeleteV1 = jest.fn()
const mockDeleteV2 = jest.fn()
const mockDispatch = jest.fn()
const mockAssertWalletChain = jest.fn()
const mockIsEthSignWallet = jest.fn()
const mockSignTypedData = jest.fn()
const mockSignData = jest.fn()
const SIGNER = { address: 'signer' }
let mockOnboard: object | null = {}

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  useDelegatesDeleteDelegateV1Mutation: () => [mockDeleteV1],
  useDelegatesDeleteDelegateV2Mutation: () => [mockDeleteV2],
}))

jest.mock('@/hooks/wallets/useOnboard', () => ({
  __esModule: true,
  default: () => mockOnboard,
}))

jest.mock('@/services/tx/tx-sender/sdk', () => ({
  assertWalletChain: (...args: unknown[]) => mockAssertWalletChain(...args),
  getAssertedChainSigner: async () => SIGNER,
}))

jest.mock('@/features/proposers/utils/utils', () => ({
  signProposerTypedData: (...args: unknown[]) => mockSignTypedData(...args),
  signProposerData: (...args: unknown[]) => mockSignData(...args),
}))

jest.mock('@/utils/wallets', () => ({
  isEthSignWallet: () => mockIsEthSignWallet(),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

const policy = asActivePolicy(mockProposerPolicy())
const ref = { policy, proposer: policy.data.proposers[0] }
const unwrapped = (value?: unknown) => ({ unwrap: () => Promise.resolve(value) })

describe('useRemoveProposer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnboard = {}
    mockAssertWalletChain.mockResolvedValue({ address: MOCK_ADDRESSES.alice, provider: {}, label: 'MetaMask' })
    mockIsEthSignWallet.mockReturnValue(false)
    mockSignTypedData.mockResolvedValue('0xtyped')
    mockSignData.mockResolvedValue('0xethsign')
    mockDeleteV1.mockReturnValue(unwrapped())
    mockDeleteV2.mockReturnValue(unwrapped())
  })

  it('should, when confirmed, switch to the Safe chain, sign the typed data and delete the delegate', async () => {
    const onRemoved = jest.fn()
    const { result } = renderHook(() => useRemoveProposer(ref, onRemoved))

    await act(() => result.current.removeProposer())

    expect(mockAssertWalletChain).toHaveBeenCalledWith(mockOnboard, MOCK_SAFES.treasury.chainId)
    expect(mockSignTypedData).toHaveBeenCalledWith(MOCK_SAFES.treasury.chainId, MOCK_ADDRESSES.bob, SIGNER)
    expect(mockDeleteV2).toHaveBeenCalledWith({
      chainId: MOCK_SAFES.treasury.chainId,
      delegateAddress: MOCK_ADDRESSES.bob,
      deleteDelegateV2Dto: { delegator: MOCK_ADDRESSES.alice, safe: MOCK_SAFES.treasury.address, signature: '0xtyped' },
    })
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(onRemoved).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeUndefined()
  })

  it('should, when the wallet only signs with eth_sign, use the v1 endpoint', async () => {
    mockIsEthSignWallet.mockReturnValue(true)
    const { result } = renderHook(() => useRemoveProposer(ref, jest.fn()))

    await act(() => result.current.removeProposer())

    expect(mockSignData).toHaveBeenCalledWith(MOCK_ADDRESSES.bob, SIGNER)
    expect(mockDeleteV1).toHaveBeenCalledWith({
      chainId: MOCK_SAFES.treasury.chainId,
      delegateAddress: MOCK_ADDRESSES.bob,
      deleteDelegateDto: { delegate: MOCK_ADDRESSES.bob, delegator: MOCK_ADDRESSES.alice, signature: '0xethsign' },
    })
    expect(mockDeleteV2).not.toHaveBeenCalled()
  })

  it('should, when the delete fails, surface the error and keep the proposer', async () => {
    mockDeleteV2.mockReturnValue({ unwrap: () => Promise.reject(new Error('Invalid signature')) })
    const onRemoved = jest.fn()
    const { result } = renderHook(() => useRemoveProposer(ref, onRemoved))

    await act(() => result.current.removeProposer())

    expect(result.current.error?.message).toBe('Invalid signature')
    expect(result.current.isRemoving).toBe(false)
    expect(onRemoved).not.toHaveBeenCalled()
  })

  it('should, when the user rejects the signature, delete nothing', async () => {
    mockSignTypedData.mockRejectedValue(new Error('User rejected'))
    const { result } = renderHook(() => useRemoveProposer(ref, jest.fn()))

    await act(() => result.current.removeProposer())

    expect(mockDeleteV2).not.toHaveBeenCalled()
    expect(result.current.error?.message).toBe('User rejected')
  })

  it('should, when no wallet is connected, ask to connect one', async () => {
    mockOnboard = null
    const { result } = renderHook(() => useRemoveProposer(ref, jest.fn()))

    await act(() => result.current.removeProposer())

    expect(result.current.error?.message).toBe('Please connect your wallet first')
    expect(mockAssertWalletChain).not.toHaveBeenCalled()
  })

  it('should, when another owner tries to remove the role, refuse before asking for a signature', async () => {
    mockAssertWalletChain.mockResolvedValue({
      address: '0x1111111111111111111111111111111111111111',
      provider: {},
      label: 'MetaMask',
    })
    const { result } = renderHook(() => useRemoveProposer(ref, jest.fn()))

    await act(() => result.current.removeProposer())

    expect(result.current.error?.message).toBe('Only the signer who granted this proposer role can remove it')
    expect(mockSignTypedData).not.toHaveBeenCalled()
    expect(mockDeleteV2).not.toHaveBeenCalled()
  })

  it('should, when the proposer removes itself, delete the grant on behalf of its delegator', async () => {
    mockAssertWalletChain.mockResolvedValue({ address: MOCK_ADDRESSES.bob, provider: {}, label: 'MetaMask' })
    const { result } = renderHook(() => useRemoveProposer(ref, jest.fn()))

    await act(() => result.current.removeProposer())

    expect(mockDeleteV2).toHaveBeenCalledWith(
      expect.objectContaining({
        deleteDelegateV2Dto: expect.objectContaining({ delegator: MOCK_ADDRESSES.alice }),
      }),
    )
  })
})
