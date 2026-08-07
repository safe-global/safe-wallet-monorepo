import React from 'react'
import { Text } from 'react-native'
import { fireEvent, render } from '@/src/tests/test-utils'
import { QrCamera } from './QrCamera'

jest.mock('react-native-vision-camera', () => ({
  Camera: jest.fn(() => null),
  useCodeScanner: jest.fn(() => ({})),
  useCameraDevice: jest.fn(() => null),
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: React.ReactNode }) => children,
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}))

const renderQrCamera = (overrides: Partial<React.ComponentProps<typeof QrCamera>> = {}) =>
  render(
    <QrCamera
      permission="denied"
      isCameraActive={false}
      onScan={jest.fn()}
      onActivateCamera={jest.fn()}
      onRequestPermission={jest.fn()}
      onPressSettings={jest.fn()}
      footer={null}
      {...overrides}
    />,
  )

describe('QrCamera', () => {
  it('does NOT call onPressSettings when the user taps the lens wrapper while permission is denied', () => {
    const onPressSettings = jest.fn()
    const { getByTestId } = renderQrCamera({ permission: 'denied', onPressSettings })

    fireEvent.press(getByTestId('camera-lens-wrapper'))

    expect(onPressSettings).not.toHaveBeenCalled()
  })

  it('does NOT call onPressSettings when the user taps the lens wrapper while permission is restricted', () => {
    const onPressSettings = jest.fn()
    const { getByTestId } = renderQrCamera({ permission: 'restricted', onPressSettings })

    fireEvent.press(getByTestId('camera-lens-wrapper'))

    expect(onPressSettings).not.toHaveBeenCalled()
  })

  it('does NOT call onRequestPermission when the user taps the lens wrapper while permission is not-determined', () => {
    const onRequestPermission = jest.fn()
    const { getByTestId } = renderQrCamera({ permission: 'not-determined', onRequestPermission })

    fireEvent.press(getByTestId('camera-lens-wrapper'))

    expect(onRequestPermission).not.toHaveBeenCalled()
  })

  it('calls onPressSettings only when the explicit "Open Settings" button is tapped while denied', () => {
    const onPressSettings = jest.fn()
    const { getByTestId } = renderQrCamera({ permission: 'denied', onPressSettings })

    fireEvent.press(getByTestId('camera-open-settings'))

    expect(onPressSettings).toHaveBeenCalledTimes(1)
  })

  it('calls onActivateCamera when the user taps the lens wrapper while permission is granted but camera inactive', () => {
    const onActivateCamera = jest.fn()
    const { getByTestId } = renderQrCamera({
      permission: 'granted',
      isCameraActive: false,
      onActivateCamera,
    })

    fireEvent.press(getByTestId('camera-lens-wrapper'))

    expect(onActivateCamera).toHaveBeenCalledTimes(1)
  })

  it('renders centerOverlay instead of the permission CTA when provided (granted)', () => {
    const onActivateCamera = jest.fn()
    const { getByText, queryByTestId } = renderQrCamera({
      permission: 'granted',
      isCameraActive: false,
      centerOverlay: <Text>overlay-content</Text>,
      onActivateCamera,
    })

    expect(getByText('overlay-content')).toBeTruthy()
    // The "Continue" activation button is suppressed while an overlay owns the lens.
    expect(queryByTestId('camera-continue')).toBeNull()
  })

  it('does not activate the camera when tapping the lens while centerOverlay owns it', () => {
    const onActivateCamera = jest.fn()
    const { getByTestId } = renderQrCamera({
      permission: 'granted',
      isCameraActive: false,
      centerOverlay: <Text>overlay-content</Text>,
      onActivateCamera,
    })

    fireEvent.press(getByTestId('camera-lens-wrapper'))
    expect(onActivateCamera).not.toHaveBeenCalled()
  })
})
