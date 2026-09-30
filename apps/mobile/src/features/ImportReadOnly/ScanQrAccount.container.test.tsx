import React from 'react'
import { fireEvent, render } from '@/src/tests/test-utils'
import { ScanQrAccountContainer } from './ScanQrAccount.container'

type CapturedQrProps = {
  centerOverlay?: React.ReactNode
  heading?: React.ReactNode
}

let qrProps: CapturedQrProps | undefined

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/src/components/Camera', () => {
  const React = require('react')
  const { View, Text, Pressable } = require('react-native')
  return {
    QrCamera: (props: CapturedQrProps) => {
      qrProps = props
      return props.centerOverlay != null ? <View testID="center-overlay">{props.centerOverlay}</View> : null
    },
    ScanErrorOverlay: ({
      message,
      onTryAgain,
      testID,
    }: {
      message: string
      onTryAgain: () => void
      testID?: string
    }) => (
      <Pressable testID={testID} onPress={onTryAgain}>
        <Text>{message}</Text>
      </Pressable>
    ),
    useCameraPermissionFlow: () => ({ permission: 'granted', requestPermission: jest.fn(), openSettings: jest.fn() }),
  }
})

const mockOnTryAgain = jest.fn()
const mockUseScan = jest.fn()
jest.mock('@/src/features/ImportReadOnly/hooks/useScan', () => ({
  useScan: () => mockUseScan(),
}))

const baseScan = {
  onScan: jest.fn(),
  isCameraActive: true,
  setIsCameraActive: jest.fn(),
  errorMessage: null as string | null,
  onTryAgain: mockOnTryAgain,
}

describe('ScanQrAccountContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    qrProps = undefined
    mockUseScan.mockReturnValue(baseScan)
  })

  it('shows no error overlay and keeps the scanning heading while scanning', () => {
    const { queryByTestId } = render(<ScanQrAccountContainer />)

    expect(queryByTestId('center-overlay')).toBeNull()
    expect(qrProps?.heading).toBe('Scan a QR code')
  })

  it('renders the error overlay on the lens and wires Try again when useScan reports an error', () => {
    mockUseScan.mockReturnValue({ ...baseScan, errorMessage: 'Not a valid address', isCameraActive: false })
    const { getByText, getByTestId } = render(<ScanQrAccountContainer />)

    expect(getByText('Not a valid address')).toBeTruthy()
    expect(qrProps?.heading).toBeUndefined()

    fireEvent.press(getByTestId('import-scan-try-again'))
    expect(mockOnTryAgain).toHaveBeenCalledTimes(1)
  })
})
