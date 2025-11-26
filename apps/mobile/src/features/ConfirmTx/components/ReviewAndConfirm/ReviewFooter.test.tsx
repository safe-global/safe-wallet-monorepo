import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '@/src/theme/tamagui.config'
import { ReviewFooter } from './ReviewFooter'
import type { Signer } from '@/src/store/signersSlice'

// Test wrapper with Tamagui provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={config}>{children}</TamaguiProvider>
)

const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper })
}

// Mock SelectSigner to avoid FlashList issues
jest.mock('@/src/components/SelectSigner', () => ({
  SelectSigner: () => null,
}))

describe('ReviewFooter', () => {
  const mockSigner: Signer = {
    value: '0x456' as `0x${string}`,
    name: 'Test Signer',
    logoUri: null,
    type: 'private-key',
  }

  const mockOnConfirmPress = jest.fn()

  const defaultProps = {
    txId: 'test-tx-id',
    activeSigner: mockSigner,
    isSigningLoading: false,
    onConfirmPress: mockOnConfirmPress,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Button state and text', () => {
    it('should display "Confirm transaction" when idle', () => {
      renderWithProviders(<ReviewFooter {...defaultProps} />)

      const button = screen.getByText('Confirm transaction')
      expect(button).toBeOnTheScreen()
    })

    it('should change to "Validating" with loading state when signing', () => {
      renderWithProviders(<ReviewFooter {...defaultProps} isSigningLoading={true} />)

      const button = screen.getByText('Validating')
      expect(button).toBeOnTheScreen()
    })

    it('should call onConfirmPress when confirm button is pressed', () => {
      renderWithProviders(<ReviewFooter {...defaultProps} />)

      const button = screen.getByText('Confirm transaction')
      fireEvent.press(button)

      expect(mockOnConfirmPress).toHaveBeenCalledTimes(1)
    })

    it('should show loading state when isSigningLoading is true', () => {
      renderWithProviders(<ReviewFooter {...defaultProps} isSigningLoading={true} />)

      // Button text should change to "Validating"
      expect(screen.getByText('Validating')).toBeOnTheScreen()
      // "Confirm transaction" should not be visible
      expect(screen.queryByText('Confirm transaction')).not.toBeOnTheScreen()
    })
  })
})
