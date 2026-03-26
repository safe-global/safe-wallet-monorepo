import { render } from '@/tests/test-utils'
import { WalletInfo } from '@/components/common/WalletInfo/index'
import { type EIP1193Provider, type OnboardAPI } from '@web3-onboard/core'
import { act } from '@testing-library/react'

const mockWallet = {
  address: '0x1234567890123456789012345678901234567890',
  chainId: '5',
  label: '',
  provider: null as unknown as EIP1193Provider,
}

const mockOnboard = {
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  setChain: jest.fn(),
} as unknown as OnboardAPI

describe('WalletInfo', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should display the wallet address', () => {
    const { getByText } = render(
      <WalletInfo
        wallet={mockWallet}
        onboard={mockOnboard}
        addressBook={{}}
        handleClose={jest.fn()}
        balance={undefined}
        currentChainId="1"
      />,
    )

    expect(getByText('0x1234...7890')).toBeInTheDocument()
  })

  it('should display a switch wallet button', () => {
    const { getByText } = render(
      <WalletInfo
        wallet={mockWallet}
        onboard={mockOnboard}
        addressBook={{}}
        handleClose={jest.fn()}
        balance={undefined}
        currentChainId="1"
      />,
    )

    expect(getByText('Switch wallet')).toBeInTheDocument()
  })

  it('should disconnect the wallet when the button is clicked', () => {
    const { getByText } = render(
      <WalletInfo
        wallet={mockWallet}
        onboard={mockOnboard}
        addressBook={{}}
        handleClose={jest.fn()}
        balance={undefined}
        currentChainId="1"
      />,
    )

    const disconnectButton = getByText('Disconnect')

    expect(disconnectButton).toBeInTheDocument()

    act(() => {
      disconnectButton.click()
    })

    expect(mockOnboard.disconnectWallet).toHaveBeenCalled()
  })

  it('calls onSwitch when Switch wallet is clicked', () => {
    const onSwitch = jest.fn()
    const { getByText } = render(
      <WalletInfo
        wallet={mockWallet}
        onboard={mockOnboard}
        addressBook={{}}
        handleClose={jest.fn()}
        balance={undefined}
        currentChainId="1"
        onSwitch={onSwitch}
      />,
    )

    act(() => {
      getByText('Switch wallet').click()
    })

    expect(onSwitch).toHaveBeenCalledTimes(1)
  })

  it('calls onDisconnect when Disconnect is clicked', () => {
    const onDisconnect = jest.fn()
    const { getByText } = render(
      <WalletInfo
        wallet={mockWallet}
        onboard={mockOnboard}
        addressBook={{}}
        handleClose={jest.fn()}
        balance={undefined}
        currentChainId="1"
        onDisconnect={onDisconnect}
      />,
    )

    act(() => {
      getByText('Disconnect').click()
    })

    expect(onDisconnect).toHaveBeenCalledTimes(1)
  })

  it('does not throw when onSwitch is not provided', () => {
    const { getByText } = render(
      <WalletInfo
        wallet={mockWallet}
        onboard={mockOnboard}
        addressBook={{}}
        handleClose={jest.fn()}
        balance={undefined}
        currentChainId="1"
      />,
    )

    expect(() => {
      act(() => {
        getByText('Switch wallet').click()
      })
    }).not.toThrow()
  })

  it('does not throw when onDisconnect is not provided', () => {
    const { getByText } = render(
      <WalletInfo
        wallet={mockWallet}
        onboard={mockOnboard}
        addressBook={{}}
        handleClose={jest.fn()}
        balance={undefined}
        currentChainId="1"
      />,
    )

    expect(() => {
      act(() => {
        getByText('Disconnect').click()
      })
    }).not.toThrow()
  })
})
