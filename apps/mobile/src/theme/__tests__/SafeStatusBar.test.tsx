import React from 'react'
import { render } from '@testing-library/react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeStatusBar } from '../SafeStatusBar'

const mockUseTheme = jest.fn()
jest.mock('@/src/theme/hooks/useTheme', () => ({
  useTheme: () => ({ currentTheme: mockUseTheme() }),
}))

const mockUseSegments = jest.fn()
jest.mock('expo-router', () => ({
  useSegments: () => mockUseSegments(),
}))

describe('SafeStatusBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders light style for dark screens regardless of theme', () => {
    mockUseTheme.mockReturnValue('dark')
    mockUseSegments.mockReturnValue(['root', 'onboarding'])
    const { UNSAFE_getByType } = render(<SafeStatusBar />)

    expect(UNSAFE_getByType(StatusBar).props.style).toBe('light')
  })

  it('renders light style when theme is dark and not dark screen', () => {
    mockUseTheme.mockReturnValue('dark')
    mockUseSegments.mockReturnValue(['home'])
    const { UNSAFE_getByType } = render(<SafeStatusBar />)

    expect(UNSAFE_getByType(StatusBar).props.style).toBe('light')
  })

  it('renders dark style when theme is light and not dark screen', () => {
    mockUseTheme.mockReturnValue('light')
    mockUseSegments.mockReturnValue(['home'])
    const { UNSAFE_getByType } = render(<SafeStatusBar />)

    expect(UNSAFE_getByType(StatusBar).props.style).toBe('dark')
  })
})
