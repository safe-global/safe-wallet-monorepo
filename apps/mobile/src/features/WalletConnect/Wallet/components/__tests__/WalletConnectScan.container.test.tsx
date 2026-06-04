import React from 'react'
import { fireEvent, render } from '@/src/tests/test-utils'
import type { CameraPermissionStatus } from 'react-native-vision-camera'
import { WalletConnectScanContainer } from '../WalletConnectScan.container'
import type { ScanStatus } from '../../hooks/useWalletConnectScan'

const baseHook: {
  status: ScanStatus
  errorMessage: string
  isCameraActive: boolean
  permission: CameraPermissionStatus
  requestPermission: jest.Mock
  openSettings: jest.Mock
  onScan: jest.Mock
  onTryAgain: jest.Mock
  onActivateCamera: jest.Mock
  onPasteUri: jest.Mock
} = {
  status: 'scanning',
  errorMessage: '',
  isCameraActive: true,
  permission: 'granted' as CameraPermissionStatus,
  requestPermission: jest.fn(),
  openSettings: jest.fn(),
  onScan: jest.fn(),
  onTryAgain: jest.fn(),
  onActivateCamera: jest.fn(),
  onPasteUri: jest.fn(),
}

const mockUseScan = jest.fn(() => baseHook)
jest.mock('../../hooks/useWalletConnectScan', () => ({
  useWalletConnectScan: () => mockUseScan(),
}))

// QrCamera renders its centerOverlay so we can assert per-status content.
jest.mock('@/src/components/Camera', () => {
  const React = require('react')
  return {
    QrCamera: ({ centerOverlay }: { centerOverlay?: React.ReactNode }) => <>{centerOverlay}</>,
  }
})

describe('WalletConnectScanContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseScan.mockReturnValue(baseHook)
  })

  it('shows the scan prompt in the scanning state', () => {
    const { getByText } = render(<WalletConnectScanContainer />)
    expect(getByText('Scan a QR code')).toBeTruthy()
  })

  it('shows the connecting indicator while connecting', () => {
    mockUseScan.mockReturnValue({ ...baseHook, status: 'connecting', isCameraActive: false })
    const { getByText } = render(<WalletConnectScanContainer />)
    expect(getByText('Connecting…')).toBeTruthy()
  })

  it('shows the error message and a Try again button in the error state', () => {
    const onTryAgain = jest.fn()
    mockUseScan.mockReturnValue({
      ...baseHook,
      status: 'error',
      errorMessage: 'Unrecognised QR code',
      isCameraActive: false,
      onTryAgain,
    })
    const { getByText } = render(<WalletConnectScanContainer />)
    expect(getByText('Unrecognised QR code')).toBeTruthy()

    fireEvent.press(getByText('Try again'))
    expect(onTryAgain).toHaveBeenCalledTimes(1)
  })
})
