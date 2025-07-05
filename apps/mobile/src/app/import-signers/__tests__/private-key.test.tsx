import React from 'react'
import { render } from '@/src/tests/test-utils'
jest.mock('react-native-capture-protection')

const { __mockPrevent: mockPrevent, __mockAllow: mockAllow } = require('react-native-capture-protection')

// Mock useFocusEffect but allow us to capture and execute the callback
let focusEffectCallback: (() => (() => void) | void) | null = null
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn((callback: () => (() => void) | void) => {
    focusEffectCallback = callback
    // Don't execute automatically - let tests control when it runs
  }),
}))

// Mock ImportPrivateKey component to avoid complex dependencies
jest.mock('@/src/features/ImportPrivateKey', () => {
  const { View } = require('react-native')
  return {
    ImportPrivateKey: () => <View testID="import-private-key" />,
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))

import PrivateKeyImport from '@/src/app/import-signers/private-key'

describe('PrivateKeyImport Screen - Capture Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    focusEffectCallback = null
  })

  it('should render the private key import screen', () => {
    const { getByTestId } = render(<PrivateKeyImport />)

    expect(getByTestId('import-private-key')).toBeTruthy()
  })

  it('should setup useFocusEffect hook', () => {
    const mockUseFocusEffect = require('@react-navigation/native').useFocusEffect

    render(<PrivateKeyImport />)

    // Verify useFocusEffect was called
    expect(mockUseFocusEffect).toHaveBeenCalledTimes(1)
    expect(focusEffectCallback).toBeTruthy()
  })

  it('should call CaptureProtection.prevent when focus effect is triggered', () => {
    render(<PrivateKeyImport />)

    // Verify focus effect callback was stored
    expect(focusEffectCallback).toBeTruthy()

    // Execute the focus effect callback to simulate screen focus
    if (focusEffectCallback) {
      focusEffectCallback()
    }

    // Verify CaptureProtection.prevent was called with correct parameters
    expect(mockPrevent).toHaveBeenCalledTimes(1)
    expect(mockPrevent).toHaveBeenCalledWith({
      screenshot: true,
      record: true,
      appSwitcher: true,
    })
  })

  it('should call CaptureProtection.allow when cleanup function is executed', () => {
    render(<PrivateKeyImport />)

    // Execute the focus effect callback and get the cleanup function
    let cleanup: (() => void) | undefined
    if (focusEffectCallback) {
      cleanup = focusEffectCallback() as (() => void) | undefined
    }

    // Verify cleanup function exists
    expect(cleanup).toBeTruthy()
    expect(typeof cleanup).toBe('function')

    // Clear previous calls
    jest.clearAllMocks()

    // Execute cleanup function to simulate screen unfocus
    if (cleanup) {
      cleanup()
    }

    // Verify CaptureProtection.allow was called
    expect(mockAllow).toHaveBeenCalledTimes(1)
  })

  it('should have proper focus effect lifecycle (prevent on focus, allow on unfocus)', () => {
    render(<PrivateKeyImport />)

    // Execute focus effect (simulate screen focus)
    let cleanup: (() => void) | undefined
    if (focusEffectCallback) {
      cleanup = focusEffectCallback() as (() => void) | undefined
    }

    // Verify prevent was called
    expect(mockPrevent).toHaveBeenCalledTimes(1)
    expect(mockPrevent).toHaveBeenCalledWith({
      screenshot: true,
      record: true,
      appSwitcher: true,
    })

    // Execute cleanup (simulate screen unfocus)
    if (cleanup) {
      cleanup()
    }

    // Verify allow was called
    expect(mockAllow).toHaveBeenCalledTimes(1)
  })
})
