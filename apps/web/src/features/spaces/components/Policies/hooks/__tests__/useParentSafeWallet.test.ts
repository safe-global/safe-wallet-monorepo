import { renderHook, waitFor } from '@testing-library/react'
import type { SafeItem } from '@/hooks/safes'
import { useParentSafeWallet } from '../useParentSafeWallet'

const mockIsSmartContractWallet = jest.fn()
const mockUseChain = jest.fn()
const mockUseWallet = jest.fn()
const mockUseSpaceSafes = jest.fn()
const mockProvider = {}

jest.mock('@/utils/wallets', () => ({
  isSmartContractWallet: (...args: unknown[]) => mockIsSmartContractWallet(...args),
}))

jest.mock('@/hooks/useChains', () => ({
  useChain: (chainId: string) => mockUseChain(chainId),
}))

jest.mock('@/hooks/wallets/web3', () => ({
  createWeb3ReadOnly: () => mockProvider,
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('../../../../hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => mockUseSpaceSafes(),
}))

const CHAIN_ID = '1'
const WALLET = '0x2222222222222222222222222222222222222222'
const OTHER_SAFE = '0x3333333333333333333333333333333333333333'

const safeItem = (chainId: string, address: string): SafeItem => ({
  chainId,
  address,
  isReadOnly: true,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

describe('useParentSafeWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: WALLET, chainId: CHAIN_ID })
    mockUseChain.mockReturnValue({ chainId: CHAIN_ID })
    mockUseSpaceSafes.mockReturnValue({ allSafes: [safeItem(CHAIN_ID, OTHER_SAFE)] })
    mockIsSmartContractWallet.mockResolvedValue(false)
  })

  it('reports the wallet as a parent Safe when it is a Safe of the Space on the picked chain, without probing', () => {
    mockUseSpaceSafes.mockReturnValue({ allSafes: [safeItem(CHAIN_ID, WALLET.toLowerCase())] })

    const { result } = renderHook(() => useParentSafeWallet(CHAIN_ID))

    expect(result.current).toEqual({ parentSafeAddress: WALLET, isChecking: false })
    expect(mockIsSmartContractWallet).not.toHaveBeenCalled()
  })

  it('probes the wallet when the Space only holds it on another chain', async () => {
    mockUseSpaceSafes.mockReturnValue({ allSafes: [safeItem('137', WALLET)] })
    mockIsSmartContractWallet.mockResolvedValue(true)

    const { result } = renderHook(() => useParentSafeWallet(CHAIN_ID))

    await waitFor(() => expect(result.current.parentSafeAddress).toBe(WALLET))
    expect(mockIsSmartContractWallet).toHaveBeenCalledWith(CHAIN_ID, WALLET, mockProvider)
  })

  it('reports a wallet with contract code as a parent Safe', async () => {
    mockIsSmartContractWallet.mockResolvedValue(true)

    const { result } = renderHook(() => useParentSafeWallet(CHAIN_ID))

    expect(result.current.isChecking).toBe(true)
    await waitFor(() => expect(result.current).toEqual({ parentSafeAddress: WALLET, isChecking: false }))
  })

  it('reports nothing for an EOA wallet', async () => {
    const { result } = renderHook(() => useParentSafeWallet(CHAIN_ID))

    await waitFor(() => expect(result.current.isChecking).toBe(false))
    expect(mockIsSmartContractWallet).toHaveBeenCalledWith(CHAIN_ID, WALLET, mockProvider)
    expect(result.current.parentSafeAddress).toBeUndefined()
  })

  it('treats a wallet whose code cannot be read as an EOA', async () => {
    mockIsSmartContractWallet.mockRejectedValue(new Error('RPC down'))

    const { result } = renderHook(() => useParentSafeWallet(CHAIN_ID))

    await waitFor(() => expect(result.current.isChecking).toBe(false))
    expect(result.current.parentSafeAddress).toBeUndefined()
  })

  it('does nothing without a wallet', () => {
    mockUseWallet.mockReturnValue(null)

    const { result } = renderHook(() => useParentSafeWallet(CHAIN_ID))

    expect(result.current).toEqual({ parentSafeAddress: undefined, isChecking: false })
    expect(mockIsSmartContractWallet).not.toHaveBeenCalled()
  })

  it('does nothing until a Safe account is picked', () => {
    const { result } = renderHook(() => useParentSafeWallet(undefined))

    expect(result.current).toEqual({ parentSafeAddress: undefined, isChecking: false })
    expect(mockIsSmartContractWallet).not.toHaveBeenCalled()
  })

  it('does not probe when the picked chain is unknown', () => {
    mockUseChain.mockReturnValue(undefined)

    const { result } = renderHook(() => useParentSafeWallet(CHAIN_ID))

    expect(result.current).toEqual({ parentSafeAddress: undefined, isChecking: false })
    expect(mockIsSmartContractWallet).not.toHaveBeenCalled()
  })
})
