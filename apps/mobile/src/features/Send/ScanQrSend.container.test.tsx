import React from 'react'
import { act, fireEvent, render } from '@/src/tests/test-utils'
import { ScanQrSendContainer } from './ScanQrSend.container'

type CapturedQrProps = {
  onScan: (codes: { value?: string }[]) => void
  isCameraActive?: boolean
  centerOverlay?: React.ReactNode
  footer?: React.ReactNode
  heading?: React.ReactNode
}

let qrProps: CapturedQrProps | undefined
let focusCb: (() => undefined | (() => void)) | null = null

jest.mock('expo-router', () => {
  const React = require('react')
  return {
    // Run the focus callback once on mount (so the camera activates) and keep a handle so tests can
    // simulate a blur → refocus.
    useFocusEffect: (cb: () => undefined | (() => void)) => {
      focusCb = cb
      React.useEffect(cb, [])
    },
  }
})

jest.mock('@/src/components/Camera', () => {
  const React = require('react')
  const { View, Text, Pressable } = require('react-native')
  return {
    QrCamera: (props: CapturedQrProps) => {
      qrProps = props
      return (
        <>
          {props.centerOverlay != null ? <View testID="center-overlay">{props.centerOverlay}</View> : null}
          {props.footer}
        </>
      )
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
      <>
        <Text>{message}</Text>
        <Pressable testID={testID} onPress={onTryAgain}>
          <Text>Try again</Text>
        </Pressable>
      </>
    ),
    resolveScannedAddress: (raw: string) => mockResolve(raw),
    INVALID_ADDRESS_MESSAGE: 'Not a valid address',
    useCameraPermissionFlow: () => ({ permission: 'granted', requestPermission: jest.fn(), openSettings: jest.fn() }),
  }
})

const mockResolve = jest.fn()
const mockWarn = jest.fn()
const mockNavigate = jest.fn()
jest.mock('./hooks/useScannedAddressToSend', () => ({
  useScannedAddressToSend: () => ({ warnChainMismatch: mockWarn, navigateToRecipient: mockNavigate }),
}))

describe('ScanQrSendContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    qrProps = undefined
    focusCb = null
  })

  it('shows the error overlay on the lens for an invalid address and does not navigate', () => {
    mockResolve.mockReturnValue(null)
    const { getByText, getByTestId } = render(<ScanQrSendContainer />)

    act(() => qrProps?.onScan([{ value: 'https://example.com' }]))

    expect(getByTestId('center-overlay')).toBeTruthy()
    expect(getByText('Not a valid address')).toBeTruthy()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('hides the scanning heading while the error overlay is shown', () => {
    mockResolve.mockReturnValue(null)
    render(<ScanQrSendContainer />)

    expect(qrProps?.heading).toBe('Scan an address')

    act(() => qrProps?.onScan([{ value: 'nope' }]))
    expect(qrProps?.heading).toBeUndefined()
  })

  it('clears the error and re-activates scanning on Try again', () => {
    mockResolve.mockReturnValue(null)
    const { getByTestId, queryByText } = render(<ScanQrSendContainer />)

    act(() => qrProps?.onScan([{ value: 'nope' }]))
    expect(queryByText('Not a valid address')).toBeTruthy()

    act(() => fireEvent.press(getByTestId('send-scan-try-again')))
    expect(queryByText('Not a valid address')).toBeNull()
  })

  it('does not wake the camera behind the error overlay when the screen refocuses', () => {
    mockResolve.mockReturnValue(null)
    render(<ScanQrSendContainer />)

    act(() => qrProps?.onScan([{ value: 'nope' }]))
    expect(qrProps?.isCameraActive).toBe(false)

    // Blur → refocus while the error is shown must not re-arm the camera behind the overlay.
    act(() => void focusCb?.())

    expect(qrProps?.isCameraActive).toBe(false)
    expect(qrProps?.centerOverlay).toBeTruthy()
  })

  it('warns on chain mismatch and navigates to the recipient for a valid address', () => {
    mockResolve.mockReturnValue({ address: '0xabc', prefix: 'gno' })
    render(<ScanQrSendContainer />)

    act(() => qrProps?.onScan([{ value: 'gno:0xabc' }]))

    expect(mockWarn).toHaveBeenCalledWith('gno')
    expect(mockNavigate).toHaveBeenCalledWith('0xabc')
  })
})
