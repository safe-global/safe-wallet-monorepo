import React from 'react'
import { OnboardingHeader } from './OnboardingHeader'
import { render } from '@/src/tests/test-utils'
import { screen } from '@testing-library/react-native'

test('renders the OnboardingHeader component with the Safe Wallet image', () => {
  render(<OnboardingHeader />)

  const safeWalletLogo = screen.getByTestId('safe-wallet-logo')
  expect(safeWalletLogo).toBeTruthy()
})
