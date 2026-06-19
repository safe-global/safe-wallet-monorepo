import React from 'react'
import { fireEvent, render } from '@/src/tests/test-utils'
import type { CameraPermissionStatus } from 'react-native-vision-camera'
import { WalletConnectScanContainer } from '../WalletConnectScan.container'
import type { ScanStatus } from '../../hooks/useWalletConnectScan'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ router: { push: (p: string) => mockPush(p) } }))

jest.mock('@tamagui/toast', () => ({ ToastViewport: () => null }))

const mockWarnChainMismatch = jest.fn()
const mockNavigateToRecipient = jest.fn()
const mockResolveScannedAddress = jest.fn()
jest.mock('@/src/features/Send/hooks/useScannedAddressToSend', () => ({
  useScannedAddressToSend: () => ({
    warnChainMismatch: mockWarnChainMismatch,
    navigateToRecipient: mockNavigateToRecipient,
  }),
}))

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
}

const mockUseScan = jest.fn((_opts?: { onAddressScanned?: (raw: string) => boolean }) => baseHook)
jest.mock('../../hooks/useWalletConnectScan', () => ({
  useWalletConnectScan: (opts?: { onAddressScanned?: (raw: string) => boolean }) => mockUseScan(opts),
}))

const lastOnAddressScanned = () => mockUseScan.mock.calls[mockUseScan.mock.calls.length - 1][0]?.onAddressScanned

// QrCamera renders its centerOverlay and footer so we can assert per-status content and dev buttons.
// The overlay is wrapped in a marker only when actually provided, so tests can distinguish
// "no overlay passed" (scanning — QrCamera keeps its own CTA) from "overlay renders nothing".
jest.mock('@/src/components/Camera', () => {
  const React = require('react')
  const { View, Text, Pressable } = require('react-native')
  return {
    QrCamera: ({ centerOverlay, footer }: { centerOverlay?: React.ReactNode; footer?: React.ReactNode }) => (
      <>
        {centerOverlay != null ? <View testID="wc-center-overlay">{centerOverlay}</View> : null}
        {footer}
      </>
    ),
    ScanErrorOverlay: ({
      message,
      onTryAgain,
      testID,
    }: {
      message: string
      onTryAgain: () => void
      testID?: string
    }) => (
      <>
        <Text>{message}</Text>
        <Pressable testID={testID} onPress={onTryAgain}>
          <Text>Try again</Text>
        </Pressable>
      </>
    ),
    resolveScannedAddress: (raw: string) => mockResolveScannedAddress(raw),
  }
})

describe('WalletConnectScanContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseScan.mockReturnValue(baseHook)
  })

  it('passes no center overlay in the scanning state so QrCamera keeps its own CTA', () => {
    const { queryByTestId } = render(<WalletConnectScanContainer />)
    expect(queryByTestId('wc-center-overlay')).toBeNull()
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

  it('navigates to the manual entry route when "Enter manually" is pressed', () => {
    const { getByTestId } = render(<WalletConnectScanContainer />)
    fireEvent.press(getByTestId('wc-enter-manually'))
    expect(mockPush).toHaveBeenCalledWith('/wallet-connect-manual')
  })

  it('routes a scanned address into the Send flow and reports it handled', () => {
    mockResolveScannedAddress.mockReturnValue({ address: '0xabc', prefix: 'gno' })
    render(<WalletConnectScanContainer />)

    const onAddressScanned = lastOnAddressScanned()
    expect(onAddressScanned?.('gno:0xabc')).toBe(true)
    expect(mockWarnChainMismatch).toHaveBeenCalledWith('gno')
    expect(mockNavigateToRecipient).toHaveBeenCalledWith('0xabc', 'replace')
  })

  it('reports a non-address code as not handled and does not navigate', () => {
    mockResolveScannedAddress.mockReturnValue(null)
    render(<WalletConnectScanContainer />)

    const onAddressScanned = lastOnAddressScanned()
    expect(onAddressScanned?.('https://example.com')).toBe(false)
    expect(mockNavigateToRecipient).not.toHaveBeenCalled()
  })
})
