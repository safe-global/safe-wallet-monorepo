import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { ImportSignersContainer } from '../ImportSigners.container'

const mockRouterPush = jest.fn()
const mockInitiateConnection = jest.fn()
const mockUseBiometrics = jest.fn()

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    navigate: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismissAll: jest.fn(),
  },
}))

jest.mock('@/src/hooks/useBiometrics', () => ({
  useBiometrics: () => mockUseBiometrics(),
}))

jest.mock('@/src/features/WalletConnect/hooks/useWalletConnect', () => ({
  useWalletConnect: () => ({ initiateConnection: mockInitiateConnection }),
}))

jest.mock('@/src/navigation/useScrollableHeader', () => ({
  useScrollableHeader: () => ({ handleScroll: jest.fn() }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))

describe('ImportSignersContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseBiometrics.mockReturnValue({ isBiometricsEnabled: true })
  })

  it('renders all three signer import options', () => {
    render(<ImportSignersContainer />)

    expect(screen.getByText('Import using private key')).toBeTruthy()
    expect(screen.getByText('Connect hardware device')).toBeTruthy()
    expect(screen.getByText('Connect wallet app')).toBeTruthy()
  })

  it('calls initiateConnection when connect wallet app is pressed', () => {
    render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('connectSigner'))

    expect(mockInitiateConnection).toHaveBeenCalled()
  })

  it('navigates to private key screen when seed is pressed', () => {
    render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('seed'))

    expect(mockRouterPush).toHaveBeenCalledWith('/import-signers/signer')
  })

  it('navigates to hardware devices when hardware signer is pressed', () => {
    render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('hardwareSigner'))

    expect(mockRouterPush).toHaveBeenCalledWith('/import-signers/hardware-devices')
  })

  it('navigates to biometrics opt-in when biometrics is not enabled', () => {
    mockUseBiometrics.mockReturnValue({ isBiometricsEnabled: false })

    render(<ImportSignersContainer />)

    fireEvent.press(screen.getByTestId('seed'))

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/biometrics-opt-in',
      params: { caller: '/import-signers' },
    })
  })
})
