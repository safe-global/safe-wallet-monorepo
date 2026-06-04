import React from 'react'
import { renderWithStore, createTestStore, fireEvent } from '@/src/tests/test-utils'
import { HeaderQrButton } from '../HeaderQrButton'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  router: { push: (path: string) => mockPush(path) },
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
})
