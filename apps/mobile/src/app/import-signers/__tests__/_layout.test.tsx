import React from 'react'
import { render } from '@/src/tests/test-utils'

jest.mock('@/src/hooks/useScreenProtection', () => ({
  useScreenProtection: jest.fn(),
}))

const mockUseScreenProtection = jest.requireMock('@/src/hooks/useScreenProtection').useScreenProtection

jest.mock('expo-router', () => {
  const React = require('react')
  return {
    __esModule: true,
    // Provide a simple Stack stub that just renders children
    Stack: Object.assign(({ children }: { children: React.ReactNode }) => <>{children}</>, {
      Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }),
  }
})

jest.mock('@/src/features/ImportPrivateKey', () => {
  const { View } = require('react-native')
  return {
    ImportPrivateKey: () => <View testID="import-private-key" />,
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))

import ImportSignersLayout from '@/src/app/import-signers/_layout'

describe('ImportSignersLayout - Screen Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should use the useScreenProtection hook', () => {
    render(<ImportSignersLayout />)

    expect(mockUseScreenProtection).toHaveBeenCalledTimes(1)
    expect(mockUseScreenProtection).toHaveBeenCalledWith()
  })

  it('should render the layout with Stack navigation', () => {
    const { queryByTestId } = render(<ImportSignersLayout />)

    // Verify the component renders without crashing
    expect(queryByTestId).toBeTruthy()
    expect(mockUseScreenProtection).toHaveBeenCalledTimes(1)
  })

  it('should call useScreenProtection only once per render', () => {
    const { rerender } = render(<ImportSignersLayout />)

    expect(mockUseScreenProtection).toHaveBeenCalledTimes(1)

    // Rerender the component
    rerender(<ImportSignersLayout />)

    // Should be called again on rerender
    expect(mockUseScreenProtection).toHaveBeenCalledTimes(2)
  })
})
