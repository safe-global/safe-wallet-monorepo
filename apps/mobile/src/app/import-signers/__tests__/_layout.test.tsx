import React from 'react'
import { render } from '@/src/tests/test-utils'
jest.mock('react-native-capture-protection')

const { __mockPrevent: mockPrevent, __mockAllow: mockAllow } = require('react-native-capture-protection')

// Mock useFocusEffect but allow us to capture and execute the callback
let focusEffectCallback: (() => (() => void) | void) | null = null
jest.mock('expo-router', () => {
  const React = require('react')
  return {
    __esModule: true,
    // Provide a simple Stack stub that just renders children
    Stack: Object.assign(({ children }: { children: React.ReactNode }) => <>{children}</>, {
      Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }),
    useFocusEffect: jest.fn((callback: () => (() => void) | void) => {
      focusEffectCallback = callback
    }),
  }
})

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

import ImportSignersLayout from '@/src/app/import-signers/_layout'

describe('ImportSignersLayout - Capture Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    focusEffectCallback = null
  })

  it('should setup useFocusEffect hook', () => {
    const mockUseFocusEffect = require('expo-router').useFocusEffect

    render(<ImportSignersLayout />)

    expect(mockUseFocusEffect).toHaveBeenCalledTimes(1)
    expect(focusEffectCallback).toBeTruthy()
  })

  it('should call CaptureProtection.prevent when focus effect is triggered', () => {
    render(<ImportSignersLayout />)

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
    render(<ImportSignersLayout />)

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
    render(<ImportSignersLayout />)

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
