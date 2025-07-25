import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import { useLocalSearchParams } from 'expo-router'
import { SignTransaction } from './SignTransaction'
import { useSigningGuard } from './hooks/useSigningGuard'
import { useTransactionSigning } from './hooks/useTransactionSigning'

// Mock the hooks
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}))

jest.mock('./hooks/useSigningGuard', () => ({
  useSigningGuard: jest.fn(),
}))

jest.mock('./hooks/useTransactionSigning', () => ({
  useTransactionSigning: jest.fn(),
}))

// Mock Redux hooks
jest.mock('@/src/store/hooks', () => ({
  useAppSelector: jest.fn(),
}))

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: jest.fn(),
}))

// Mock the child components using string components instead of React Native components
jest.mock('./SignError', () => ({
  __esModule: true,
  default: ({ description, onRetryPress }: { description: string; onRetryPress: () => void }) => {
    const React = require('react')
    return React.createElement('View', { testID: 'sign-error' }, [
      React.createElement('Text', { testID: 'error-description', key: 'description' }, description),
      React.createElement(
        'TouchableOpacity',
        { testID: 'retry-button', onPress: onRetryPress, key: 'retry' },
        React.createElement('Text', null, 'Retry'),
      ),
    ])
  },
}))

jest.mock('./SignSuccess', () => ({
  __esModule: true,
  default: () => {
    const React = require('react')
    return React.createElement('View', { testID: 'sign-success' }, React.createElement('Text', null, 'Success!'))
  },
}))

jest.mock('@/src/components/LoadingScreen', () => ({
  LoadingScreen: ({ title, description }: { title: string; description: string }) => {
    const React = require('react')
    return React.createElement('View', { testID: 'loading-screen' }, [
      React.createElement('Text', { testID: 'loading-title', key: 'title' }, title),
      React.createElement('Text', { testID: 'loading-description', key: 'description' }, description),
    ])
  },
}))

const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>
const mockUseSigningGuard = useSigningGuard as jest.MockedFunction<typeof useSigningGuard>
const mockUseTransactionSigning = useTransactionSigning as jest.MockedFunction<typeof useTransactionSigning>

// Get the mocked Redux hooks
const { useAppSelector } = require('@/src/store/hooks')
const { useDefinedActiveSafe } = require('@/src/store/hooks/activeSafe')
const mockUseAppSelector = useAppSelector as jest.MockedFunction<typeof useAppSelector>
const mockUseDefinedActiveSafe = useDefinedActiveSafe as jest.MockedFunction<typeof useDefinedActiveSafe>

describe('SignTransaction', () => {
  const mockExecuteSign = jest.fn()
  const mockRetry = jest.fn()
  const mockActiveSafe = {
    address: '0x123',
    chainId: '1',
    threshold: 2,
    owners: ['0x456', '0x789'],
  }
  const mockActiveSigner = {
    value: '0x456',
    type: 'EOA' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mocks
    mockUseLocalSearchParams.mockReturnValue({
      txId: 'test-tx-id',
    })

    mockUseDefinedActiveSafe.mockReturnValue(mockActiveSafe)
    mockUseAppSelector.mockReturnValue(mockActiveSigner)

    mockUseSigningGuard.mockReturnValue({
      canSign: true,
    })

    mockUseTransactionSigning.mockReturnValue({
      status: 'idle',
      executeSign: mockExecuteSign,
      retry: mockRetry,
      reset: jest.fn(),
      isApiLoading: false,
      apiData: undefined,
      isApiError: false,
      hasTriggeredAutoSign: false,
    })
  })

  describe('parameter validation', () => {
    it('should render error when txId is missing', () => {
      mockUseLocalSearchParams.mockReturnValue({})

      render(<SignTransaction />)

      expect(screen.getByTestId('sign-error')).toBeOnTheScreen()
      expect(screen.getByTestId('error-description')).toHaveTextContent('Missing transaction ID')
    })

    it('should render error when active signer is missing', () => {
      mockUseAppSelector.mockReturnValue(null)

      render(<SignTransaction />)

      expect(screen.getByTestId('sign-error')).toBeOnTheScreen()
      expect(screen.getByTestId('error-description')).toHaveTextContent('No signer selected')
    })

    it('should render error when txId is empty string', () => {
      mockUseLocalSearchParams.mockReturnValue({
        txId: '',
      })

      render(<SignTransaction />)

      expect(screen.getByTestId('sign-error')).toBeOnTheScreen()
      expect(screen.getByTestId('error-description')).toHaveTextContent('Missing transaction ID')
    })
  })

  describe('auto-signing logic', () => {
    it('should call executeSign when user can sign and status is idle', async () => {
      mockUseSigningGuard.mockReturnValue({
        canSign: true,
      })

      mockUseTransactionSigning.mockReturnValue({
        status: 'idle',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: false,
        apiData: undefined,
        isApiError: false,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      await waitFor(() => {
        expect(mockExecuteSign).toHaveBeenCalled()
      })
    })

    it('should not call executeSign when user cannot sign', () => {
      mockUseSigningGuard.mockReturnValue({
        canSign: false,
      })

      render(<SignTransaction />)

      expect(mockExecuteSign).not.toHaveBeenCalled()
    })

    it('should not call executeSign when status is not idle', () => {
      mockUseTransactionSigning.mockReturnValue({
        status: 'loading',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: false,
        apiData: undefined,
        isApiError: false,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      expect(mockExecuteSign).not.toHaveBeenCalled()
    })

    it('should not call executeSign when txId is missing', () => {
      mockUseLocalSearchParams.mockReturnValue({})

      render(<SignTransaction />)

      expect(mockExecuteSign).not.toHaveBeenCalled()
    })

    it('should not call executeSign when activeSigner is missing', () => {
      mockUseAppSelector.mockReturnValue(null)

      render(<SignTransaction />)

      expect(mockExecuteSign).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should render SignError for API errors', () => {
      mockUseTransactionSigning.mockReturnValue({
        status: 'idle',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: false,
        apiData: undefined,
        isApiError: true,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      expect(screen.getByTestId('sign-error')).toBeOnTheScreen()
      expect(screen.getByTestId('error-description')).toHaveTextContent('Failed to submit transaction confirmation')
    })

    it('should render SignError for signing errors', () => {
      mockUseTransactionSigning.mockReturnValue({
        status: 'error',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: false,
        apiData: undefined,
        isApiError: false,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      expect(screen.getByTestId('sign-error')).toBeOnTheScreen()
      expect(screen.getByTestId('error-description')).toHaveTextContent('There was an error signing the transaction.')
    })

    it('should call retry when retry button is pressed', () => {
      mockUseTransactionSigning.mockReturnValue({
        status: 'error',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: false,
        apiData: undefined,
        isApiError: false,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      const retryButton = screen.getByTestId('retry-button')
      retryButton.props.onPress()

      expect(mockRetry).toHaveBeenCalled()
    })
  })

  describe('success state', () => {
    it('should render SignSuccess when signing is successful', () => {
      mockUseTransactionSigning.mockReturnValue({
        status: 'success',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: false,
        apiData: undefined,
        isApiError: false,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      expect(screen.getByTestId('sign-success')).toBeOnTheScreen()
      expect(screen.getByText('Success!')).toBeOnTheScreen()
    })
  })

  describe('loading states', () => {
    it('should render LoadingScreen when signing is in progress', () => {
      mockUseTransactionSigning.mockReturnValue({
        status: 'loading',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: false,
        apiData: undefined,
        isApiError: false,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      expect(screen.getByTestId('loading-screen')).toBeOnTheScreen()
      expect(screen.getByTestId('loading-title')).toHaveTextContent('Signing transaction...')
      expect(screen.getByTestId('loading-description')).toHaveTextContent('It may take a few seconds...')
    })

    it('should render LoadingScreen when API is loading', () => {
      mockUseTransactionSigning.mockReturnValue({
        status: 'idle',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: true,
        apiData: undefined,
        isApiError: false,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      expect(screen.getByTestId('loading-screen')).toBeOnTheScreen()
      expect(screen.getByTestId('loading-title')).toHaveTextContent('Signing transaction...')
    })

    it('should render preparation loading screen for idle authorized state', () => {
      mockUseSigningGuard.mockReturnValue({
        canSign: true,
      })

      mockUseTransactionSigning.mockReturnValue({
        status: 'idle',
        executeSign: mockExecuteSign,
        retry: mockRetry,
        reset: jest.fn(),
        isApiLoading: false,
        apiData: undefined,
        isApiError: false,
        hasTriggeredAutoSign: false,
      })

      render(<SignTransaction />)

      expect(screen.getByTestId('loading-screen')).toBeOnTheScreen()
      expect(screen.getByTestId('loading-title')).toHaveTextContent('Preparing to sign...')
      expect(screen.getByTestId('loading-description')).toHaveTextContent('Initializing signing process...')
    })
  })

  describe('hook integration', () => {
    it('should pass correct parameters to useTransactionSigning', () => {
      render(<SignTransaction />)

      expect(mockUseTransactionSigning).toHaveBeenCalledWith({
        txId: 'test-tx-id',
        signerAddress: '0x456',
      })
    })

    it('should call useSigningGuard with no parameters', () => {
      render(<SignTransaction />)

      expect(mockUseSigningGuard).toHaveBeenCalledWith()
    })

    it('should call useDefinedActiveSafe with no parameters', () => {
      render(<SignTransaction />)

      expect(mockUseDefinedActiveSafe).toHaveBeenCalledWith()
    })

    it('should call useAppSelector with selectActiveSigner', () => {
      render(<SignTransaction />)

      expect(mockUseAppSelector).toHaveBeenCalled()
      // The selector function is called with state and safe address
      const selectorCall = mockUseAppSelector.mock.calls[0][0]
      expect(typeof selectorCall).toBe('function')
    })
  })
})
