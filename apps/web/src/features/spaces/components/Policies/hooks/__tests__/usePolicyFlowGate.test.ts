import { renderHook } from '@/tests/test-utils'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'
import { mockConnectedWallet } from '../../mocks/wallet'
import usePolicyFlowGate from '../usePolicyFlowGate'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/components/common/ConnectWallet/useConnectWallet')

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseConnectWallet = useConnectWallet as jest.MockedFunction<typeof useConnectWallet>

describe('usePolicyFlowGate', () => {
  it('should, when a wallet is connected, open the flow without opening the connect dialog', async () => {
    const connectWallet = jest.fn()
    mockUseConnectWallet.mockReturnValue(connectWallet)
    mockUseWallet.mockReturnValue(mockConnectedWallet('0x0000000000000000000000000000000000000A11'))
    const openFlow = jest.fn()

    const { result } = renderHook(() => usePolicyFlowGate())
    const didOpen = await result.current(openFlow)

    expect(didOpen).toBe(true)
    expect(openFlow).toHaveBeenCalledTimes(1)
    expect(connectWallet).not.toHaveBeenCalled()
  })

  it('should, when no wallet is connected, open the connect dialog instead of the flow', async () => {
    const connectWallet = jest.fn().mockResolvedValue([])
    mockUseConnectWallet.mockReturnValue(connectWallet)
    mockUseWallet.mockReturnValue(null)
    const openFlow = jest.fn()

    const { result } = renderHook(() => usePolicyFlowGate())
    await result.current(openFlow)

    expect(connectWallet).toHaveBeenCalledTimes(1)
    expect(openFlow).not.toHaveBeenCalled()
  })

  it('should, when the user connects a wallet, open the flow they originally asked for', async () => {
    const connectWallet = jest.fn().mockResolvedValue([{ label: 'MetaMask' }])
    mockUseConnectWallet.mockReturnValue(connectWallet)
    mockUseWallet.mockReturnValue(null)
    const openFlow = jest.fn()

    const { result } = renderHook(() => usePolicyFlowGate())
    const didOpen = await result.current(openFlow)

    expect(didOpen).toBe(true)
    expect(openFlow).toHaveBeenCalledTimes(1)
  })

  it('should, when the user closes the connect dialog without connecting, open no flow', async () => {
    const connectWallet = jest.fn().mockResolvedValue(undefined)
    mockUseConnectWallet.mockReturnValue(connectWallet)
    mockUseWallet.mockReturnValue(null)
    const openFlow = jest.fn()

    const { result } = renderHook(() => usePolicyFlowGate())
    const didOpen = await result.current(openFlow)

    expect(didOpen).toBe(false)
    expect(openFlow).not.toHaveBeenCalled()
  })

  it('should, when the wallet disconnects after one flow was opened, gate the next flow again', async () => {
    const connectWallet = jest.fn().mockResolvedValue([])
    mockUseConnectWallet.mockReturnValue(connectWallet)
    mockUseWallet.mockReturnValue(mockConnectedWallet('0x0000000000000000000000000000000000000A11'))
    const openFlow = jest.fn()

    const { result, rerender } = renderHook(() => usePolicyFlowGate())
    await result.current(openFlow)

    mockUseWallet.mockReturnValue(null)
    rerender()
    await result.current(openFlow)

    expect(connectWallet).toHaveBeenCalledTimes(1)
    expect(openFlow).toHaveBeenCalledTimes(1)
  })
})
