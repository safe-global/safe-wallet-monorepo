import React from 'react'
import { act, fireEvent, render } from '@/src/tests/test-utils'
import { ScanQrSendContainer } from './ScanQrSend.container'

type CapturedQrProps = {
  onScan: (codes: { value?: string }[]) => void
  centerOverlay?: React.ReactNode
  footer?: React.ReactNode
}

let qrProps: CapturedQrProps | undefined

jest.mock('expo-router', () => {
  const React = require('react')
  return {
    // Run the focus callback once on mount so the camera activates with granted permission.
    useFocusEffect: (cb: () => undefined | (() => void)) => React.useEffect(cb, []),
  }
})

jest.mock('@/src/components/Camera/useCameraPermissionFlow', () => ({
  useCameraPermissionFlow: () => ({ permission: 'granted', requestPermission: jest.fn(), openSettings: jest.fn() }),
}))

jest.mock('@tamagui/toast', () => ({ ToastViewport: () => null }))

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
  }
})

const mockResolve = jest.fn()
const mockWarn = jest.fn()
const mockNavigate = jest.fn()
jest.mock('./hooks/useScannedAddressToSend', () => ({
  resolveScannedAddress: (raw: string) => mockResolve(raw),
  useScannedAddressToSend: () => ({ warnChainMismatch: mockWarn, navigateToRecipient: mockNavigate }),
}))

describe('ScanQrSendContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    qrProps = undefined
  })

  it('shows the error overlay on the lens for an invalid address and does not navigate', () => {
    mockResolve.mockReturnValue(null)
    const { getByText, getByTestId } = render(<ScanQrSendContainer />)

    act(() => qrProps?.onScan([{ value: 'https://example.com' }]))

    expect(getByTestId('center-overlay')).toBeTruthy()
    expect(getByText('Not a valid address')).toBeTruthy()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('clears the error and re-activates scanning on Try again', () => {
    mockResolve.mockReturnValue(null)
    const { getByTestId, queryByText } = render(<ScanQrSendContainer />)

    act(() => qrProps?.onScan([{ value: 'nope' }]))
    expect(queryByText('Not a valid address')).toBeTruthy()

    act(() => fireEvent.press(getByTestId('send-scan-try-again')))
    expect(queryByText('Not a valid address')).toBeNull()
  })

  it('warns on chain mismatch and navigates to the recipient for a valid address', () => {
    mockResolve.mockReturnValue({ address: '0xabc', prefix: 'gno' })
    render(<ScanQrSendContainer />)

    act(() => qrProps?.onScan([{ value: 'gno:0xabc' }]))

    expect(mockWarn).toHaveBeenCalledWith('gno')
    expect(mockNavigate).toHaveBeenCalledWith('0xabc')
  })
})
