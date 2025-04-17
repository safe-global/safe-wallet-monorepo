import { act, render, waitFor } from '@/tests/test-utils'
import * as useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import * as useWallet from '@/hooks/wallets/useWallet'
import WalletLogin from '../WalletLogin'
import { toBeHex } from 'ethers'
import { type EIP1193Provider } from '@web3-onboard/common'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

describe('WalletLogin', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should render continue with connected wallet', async () => {
    const mockOnLogin = jest.fn()
    const mockOnContinue = jest.fn()
    const walletAddress = toBeHex('0x1', 20)
    jest.spyOn(useWallet, 'default').mockReturnValue({
      address: walletAddress,
      chainId: '5',
      label: 'MetaMask',
      provider: {} as unknown as EIP1193Provider,
    })
    jest.spyOn(useConnectWallet, 'default').mockReturnValue(jest.fn())

    const result = render(<WalletLogin onLogin={mockOnLogin} onContinue={mockOnContinue} />)

    await waitFor(() => {
      expect(result.findByText(shortenAddress(walletAddress))).resolves.toBeDefined()
    })

    // We do not automatically invoke the callback as the user did not actively connect
    expect(mockOnLogin).not.toHaveBeenCalled()

    const button = await result.findByRole('button')
    button.click()

    expect(mockOnContinue).toHaveBeenCalled()
  })

  it('should render connect wallet if no wallet is connected', async () => {
    const mockOnLogin = jest.fn()
    const mockOnContinue = jest.fn()
    const walletAddress = toBeHex('0x1', 20)
    const mockUseWallet = jest.spyOn(useWallet, 'default').mockReturnValue(null)
    jest.spyOn(useConnectWallet, 'default').mockReturnValue(jest.fn().mockReturnValue([{}]))

    const result = render(<WalletLogin onLogin={mockOnLogin} onContinue={mockOnContinue} />)

    await waitFor(() => {
      expect(result.findByText('Connect wallet')).resolves.toBeDefined()
    })

    // We do not automatically invoke the callback
    expect(mockOnLogin).not.toHaveBeenCalled()

    await act(async () => {
      // Click the button and mock a wallet connection
      const button = await result.findByRole('button')
      button.click()
      mockUseWallet.mockReset().mockReturnValue({
        address: walletAddress,
        chainId: '5',
        label: 'MetaMask',
        provider: {} as unknown as EIP1193Provider,
      })
    })

    await waitFor(() => {
      expect(result.getByText('Connect wallet')).toBeInTheDocument()
    })
  })

  it('should invoke the callback if user actively connects', async () => {
    const mockOnLogin = jest.fn()
    const mockOnContinue = jest.fn()
    jest.spyOn(useWallet, 'default').mockReturnValue(null)

    jest.spyOn(useConnectWallet, 'default').mockReturnValue(jest.fn().mockReturnValue([]))

    const result = render(<WalletLogin onLogin={mockOnLogin} onContinue={mockOnContinue} />)

    await waitFor(() => {
      expect(result.findByText('Connect wallet')).resolves.toBeDefined()
    })

    // We do not automatically invoke the callback as the user has not actively connected yet
    expect(mockOnLogin).not.toHaveBeenCalled()

    act(() => {
      const button = result.getByRole('button')
      button.click()
    })

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled()
    })
  })
})
