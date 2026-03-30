import { renderHook, act } from '@/src/tests/test-utils'
import { faker } from '@faker-js/faker'
import { useWalletConnect } from '../useWalletConnect'

const mockOpen = jest.fn()
const mockSwitchNetwork = jest.fn()
const mockUseAccount = jest.fn()
const mockUseWalletInfo = jest.fn()
const mockUseProvider = jest.fn()

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen, switchNetwork: mockSwitchNetwork }),
  useAccount: () => mockUseAccount(),
  useWalletInfo: () => mockUseWalletInfo(),
  useProvider: () => mockUseProvider(),
}))

describe('useWalletConnect', () => {
  const address = faker.finance.ethereumAddress() as `0x${string}`

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAccount.mockReturnValue({
      address,
      isConnected: true,
      chainId: 'eip155:1',
    })
    mockUseWalletInfo.mockReturnValue({
      walletInfo: { name: 'MetaMask', icon: 'https://example.com/icon.png' },
    })
    mockUseProvider.mockReturnValue({ provider: {} })
  })

  it('returns account state from useAccount', () => {
    const { result } = renderHook(() => useWalletConnect())

    expect(result.current.isConnected).toBe(true)
    expect(result.current.address).toBe(address)
    expect(result.current.chainId).toBe('eip155:1')
  })

  it('returns walletInfo from useWalletInfo', () => {
    const { result } = renderHook(() => useWalletConnect())

    expect(result.current.walletInfo).toEqual({
      name: 'MetaMask',
      icon: 'https://example.com/icon.png',
    })
  })

  it('returns provider from useProvider', () => {
    const mockProvider = { request: jest.fn() }
    mockUseProvider.mockReturnValue({ provider: mockProvider })

    const { result } = renderHook(() => useWalletConnect())

    expect(result.current.provider).toBe(mockProvider)
  })

  it('returns undefined provider when not available', () => {
    mockUseProvider.mockReturnValue({ provider: undefined })

    const { result } = renderHook(() => useWalletConnect())

    expect(result.current.provider).toBeUndefined()
  })

  it('calls openAppKit with Connect view when open is called', () => {
    const { result } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.open()
    })

    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('calls switchNetworkAppKit with eip155 prefix', () => {
    const { result } = renderHook(() => useWalletConnect())

    act(() => {
      result.current.switchNetwork('137')
    })

    expect(mockSwitchNetwork).toHaveBeenCalledWith('eip155:137')
  })

  it('returns disconnected state when not connected', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      chainId: undefined,
    })

    const { result } = renderHook(() => useWalletConnect())

    expect(result.current.isConnected).toBe(false)
    expect(result.current.address).toBeUndefined()
    expect(result.current.chainId).toBeUndefined()
  })
})
