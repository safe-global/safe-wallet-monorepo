import React from 'react'
import { render, fireEvent } from '@/src/tests/test-utils'
import { HeaderQrButton } from '../HeaderQrButton'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  router: { push: (path: string) => mockPush(path) },
}))

const mockUseHasFeature = jest.fn()
jest.mock('@/src/hooks/useHasFeature', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

const mockSelectActiveSafe = jest.fn()
jest.mock('@/src/store/hooks', () => ({
  useAppSelector: (selector: unknown) => mockSelectActiveSafe(selector),
  useAppDispatch: () => jest.fn(),
}))
jest.mock('@/src/store/activeSafeSlice', () => ({
  ...jest.requireActual('@/src/store/activeSafeSlice'),
  selectActiveSafe: jest.fn(),
}))

const activeSafe = { address: '0x0000000000000000000000000000000000000001', chainId: '1' }

describe('HeaderQrButton', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders nothing when the feature flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockSelectActiveSafe.mockReturnValue(activeSafe)
    const { queryByLabelText } = render(<HeaderQrButton />)
    expect(queryByLabelText('Scan WalletConnect QR')).toBeNull()
  })

  it('renders nothing when there is no active safe', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockSelectActiveSafe.mockReturnValue(null)
    const { queryByLabelText } = render(<HeaderQrButton />)
    expect(queryByLabelText('Scan WalletConnect QR')).toBeNull()
  })

  it('navigates to the scan route when pressed', () => {
    mockUseHasFeature.mockReturnValue(true)
    mockSelectActiveSafe.mockReturnValue(activeSafe)
    const { getByLabelText } = render(<HeaderQrButton />)

    fireEvent.press(getByLabelText('Scan WalletConnect QR'))
    expect(mockPush).toHaveBeenCalledWith('/wallet-connect-scan')
  })
})
