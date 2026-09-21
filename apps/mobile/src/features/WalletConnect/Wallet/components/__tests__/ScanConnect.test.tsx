import React from 'react'
import { fireEvent, render } from '@/src/tests/test-utils'
import { ScanConnect } from '../ScanConnect'

// The scan container renders its received `isActive` so we can assert the camera is paused
// while the My code tab is open. The Share container is reduced to a marker so we can assert
// the My code tab actually mounts the shared Receive surface.
jest.mock('../WalletConnectScan.container', () => {
  const { Text } = require('react-native')
  return {
    WalletConnectScanContainer: ({ isActive }: { isActive?: boolean }) => (
      <Text testID="scan-marker">scan:{String(isActive)}</Text>
    ),
  }
})

jest.mock('@/src/features/Share', () => {
  const { Text } = require('react-native')
  return { ShareContainer: () => <Text testID="share-marker">share</Text> }
})

describe('ScanConnect', () => {
  it('defaults to the Scan QR tab with the camera active', () => {
    const { getByTestId } = render(<ScanConnect />)
    expect(getByTestId('scan-marker').props.children.join('')).toBe('scan:true')
  })

  it('mounts ShareContainer in the My code tab', () => {
    const { getByText, getByTestId } = render(<ScanConnect />)
    fireEvent.press(getByText('My code'))
    expect(getByTestId('share-marker')).toBeTruthy()
  })

  it('pauses the scanner camera on the My code tab, then resumes', () => {
    const { getByText, getByTestId } = render(<ScanConnect />)

    fireEvent.press(getByText('My code'))
    expect(getByTestId('scan-marker').props.children.join('')).toBe('scan:false')

    fireEvent.press(getByText('Scan QR'))
    expect(getByTestId('scan-marker').props.children.join('')).toBe('scan:true')
  })

  it('keeps the scanner mounted across tab switches so its state is preserved', () => {
    const { getByText, queryByTestId } = render(<ScanConnect />)
    fireEvent.press(getByText('My code'))
    // Still in the tree (hidden, not unmounted) — scanner state survives the switch.
    expect(queryByTestId('scan-marker', { includeHiddenElements: true })).toBeTruthy()
  })
})
