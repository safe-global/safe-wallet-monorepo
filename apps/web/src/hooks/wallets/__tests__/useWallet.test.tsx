import { renderHook } from '@/tests/test-utils'
import useWallet, { useSigner, useWalletContext } from '@/hooks/wallets/useWallet'
import { WalletContext } from '@/components/common/WalletProvider'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { Eip1193Provider } from 'ethers'

describe('useWallet hook', () => {
  it('should return null when no wallet connected', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={null}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useWallet(), { wrapper })

    expect(result.current).toBeNull()
  })

  it('should return connected wallet from context', () => {
    const mockWallet = connectedWalletBuilder().build()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={{ connectedWallet: mockWallet, signer: null }}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useWallet(), { wrapper })

    expect(result.current).toEqual(mockWallet)
  })

  it('should return wallet with correct properties', () => {
    const mockWallet: ConnectedWallet = {
      address: '0x1234567890123456789012345678901234567890',
      chainId: '1',
      label: 'MetaMask',
      provider: {} as Eip1193Provider,
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={{ connectedWallet: mockWallet, signer: null }}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useWallet(), { wrapper })

    expect(result.current?.address).toBe('0x1234567890123456789012345678901234567890')
    expect(result.current?.chainId).toBe('1')
    expect(result.current?.label).toBe('MetaMask')
  })

  it('should handle undefined context gracefully', () => {
    // Context.Provider value is undefined (not null)
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={undefined as any}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useWallet(), { wrapper })

    expect(result.current).toBeNull()
  })
})

describe('useSigner hook', () => {
  it('should return null when no signer in context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={null}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useSigner(), { wrapper })

    expect(result.current).toBeNull()
  })

  it('should return signer from context', () => {
    const mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={{ connectedWallet: null, signer: mockSigner as any }}>
        {children}
      </WalletContext.Provider>
    )

    const { result } = renderHook(() => useSigner(), { wrapper })

    expect(result.current).toEqual(mockSigner)
  })

  it('should return null when context is undefined', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={undefined as any}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useSigner(), { wrapper })

    expect(result.current).toBeNull()
  })

  it('should handle wallet without signer', () => {
    const mockWallet = connectedWalletBuilder().build()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={{ connectedWallet: mockWallet, signer: null }}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useSigner(), { wrapper })

    expect(result.current).toBeNull()
  })
})

describe('useWalletContext hook', () => {
  it('should return null when context is not provided', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={null}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useWalletContext(), { wrapper })

    expect(result.current).toBeNull()
  })

  it('should return full context with wallet and signer', () => {
    const mockWallet = connectedWalletBuilder().build()
    const mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    }

    const mockContext = {
      connectedWallet: mockWallet,
      signer: mockSigner as any,
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={mockContext}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useWalletContext(), { wrapper })

    expect(result.current).toEqual(mockContext)
    expect(result.current?.connectedWallet).toEqual(mockWallet)
    expect(result.current?.signer).toEqual(mockSigner)
  })

  it('should return context with only wallet, no signer', () => {
    const mockWallet = connectedWalletBuilder().build()
    const mockContext = {
      connectedWallet: mockWallet,
      signer: null,
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletContext.Provider value={mockContext}>{children}</WalletContext.Provider>
    )

    const { result } = renderHook(() => useWalletContext(), { wrapper })

    expect(result.current?.connectedWallet).toEqual(mockWallet)
    expect(result.current?.signer).toBeNull()
  })
})
