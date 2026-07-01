import React from 'react'
import { renderWithStore, createTestStore, fireEvent } from '@/src/tests/test-utils'
import { HeaderQrButton } from '../HeaderQrButton'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  router: { push: (path: string) => mockPush(path) },
  // Run the focus callback once on mount (resets the open-guard).
  useFocusEffect: (cb: () => void) => {
    const React = require('react')
    React.useEffect(cb, [])
  },
}))

const mockUseHasFeature = jest.fn()
jest.mock('@/src/hooks/useHasFeature', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

const activeSafe = { address: '0x0000000000000000000000000000000000000001' as `0x${string}`, chainId: '1' }

describe('HeaderQrButton', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders nothing when the feature flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const store = createTestStore({ activeSafe })
    const { queryByLabelText } = renderWithStore(<HeaderQrButton />, store)
    expect(queryByLabelText('Scan WalletConnect QR')).toBeNull()
  })

  it('renders nothing when there is no active safe', () => {
    mockUseHasFeature.mockReturnValue(true)
    const store = createTestStore({ activeSafe: null })
    const { queryByLabelText } = renderWithStore(<HeaderQrButton />, store)
    expect(queryByLabelText('Scan WalletConnect QR')).toBeNull()
  })

  it('navigates to the scan route when pressed', () => {
    mockUseHasFeature.mockReturnValue(true)
    const store = createTestStore({ activeSafe })
    const { getByLabelText } = renderWithStore(<HeaderQrButton />, store)

    fireEvent.press(getByLabelText('Scan WalletConnect QR'))
    expect(mockPush).toHaveBeenCalledWith('/wallet-connect-scan')
  })

  it('opens the scanner only once on rapid taps', () => {
    mockUseHasFeature.mockReturnValue(true)
    const store = createTestStore({ activeSafe })
    const { getByLabelText } = renderWithStore(<HeaderQrButton />, store)
    const button = getByLabelText('Scan WalletConnect QR')

    fireEvent.press(button)
    fireEvent.press(button)
    fireEvent.press(button)

    expect(mockPush).toHaveBeenCalledTimes(1)
  })

  it('re-enables the button after the fallback timeout when focus never resets it', () => {
    jest.useFakeTimers()
    try {
      mockUseHasFeature.mockReturnValue(true)
      const store = createTestStore({ activeSafe })
      const { getByLabelText } = renderWithStore(<HeaderQrButton />, store)
      const button = getByLabelText('Scan WalletConnect QR')

      fireEvent.press(button)
      expect(mockPush).toHaveBeenCalledTimes(1)

      // Without the fallback this second tap would be a no-op (guard still latched).
      jest.advanceTimersByTime(500)
      fireEvent.press(button)
      expect(mockPush).toHaveBeenCalledTimes(2)
    } finally {
      jest.useRealTimers()
    }
  })
})
