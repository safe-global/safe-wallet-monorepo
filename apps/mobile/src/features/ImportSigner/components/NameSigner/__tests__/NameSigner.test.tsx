import React from 'react'
import { faker } from '@faker-js/faker'
import { render, screen, fireEvent, act, waitFor } from '@/src/tests/test-utils'
import { NameSignerContainer } from '../NameSigner.container'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`
const mockRouterPush = jest.fn()
const mockRouterReplace = jest.fn()
const mockRouterBack = jest.fn()
const mockRouterDismissAll = jest.fn()
const mockDispatch = jest.fn()

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    address: mockAddress,
    walletName: 'MetaMask',
  }),
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: mockRouterBack,
    dismissAll: mockRouterDismissAll,
  }),
}))

jest.mock('@/src/store/hooks', () => ({
  ...jest.requireActual('@/src/store/hooks'),
  useAppDispatch: () => mockDispatch,
}))

const mockUseWalletConnectContext = jest.fn()

jest.mock('@/src/features/WalletConnect/context/WalletConnectContext', () => ({
  useWalletConnectContext: () => mockUseWalletConnectContext(),
}))

const expectedDefaultName = `MetaMask - ${mockAddress.slice(-4)}`

describe('NameSignerContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWalletConnectContext.mockReturnValue({
      isConnected: true,
      walletInfo: { name: 'MetaMask', icon: 'https://example.com/icon.png' },
      disconnect: jest.fn(),
      initiateConnection: jest.fn(),
    })
  })

  it('renders the naming screen with pre-filled name', () => {
    render(<NameSignerContainer />)

    expect(screen.getByText('Name your signer')).toBeTruthy()
    expect(screen.getByText(/Only visible to you/)).toBeTruthy()
    expect(screen.getByDisplayValue(expectedDefaultName)).toBeTruthy()
  })

  it('shows continue button', () => {
    render(<NameSignerContainer />)

    expect(screen.getByTestId('name-signer-continue')).toBeTruthy()
  })

  it('shows clear button when input has value', () => {
    render(<NameSignerContainer />)

    expect(screen.getByTestId('clear-name-button')).toBeTruthy()
  })

  it('clears the input when clear button is pressed', async () => {
    render(<NameSignerContainer />)

    const clearButton = screen.getByTestId('clear-name-button')

    await act(() => fireEvent.press(clearButton))

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeTruthy()
    })
  })

  it('dispatches addSignerWithEffects and navigates to success on continue', async () => {
    render(<NameSignerContainer />)

    const continueButton = screen.getByTestId('name-signer-continue')

    await act(() => fireEvent.press(continueButton))

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled()
      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/connect-signer-success',
        }),
      )
    })
  })
})
