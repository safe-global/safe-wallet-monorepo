import React from 'react'
import { fireEvent, render } from '@/src/tests/test-utils'
import { WalletConnectManualEntry } from '../WalletConnectManualEntry'

const VALID_URI = 'wc:7f6e9a3c@2?relay-protocol=irn&symKey=abc'

describe('WalletConnectManualEntry', () => {
  it('calls onPair with the entered wc: URI when Pair is pressed', () => {
    const onPair = jest.fn()
    const { getByPlaceholderText, getByTestId } = render(<WalletConnectManualEntry onPair={onPair} />)

    fireEvent.changeText(getByPlaceholderText('wc:…'), VALID_URI)
    fireEvent.press(getByTestId('wc-manual-pair'))

    expect(onPair).toHaveBeenCalledWith(VALID_URI)
  })

  it('shows an error and does not call onPair for a non-wc URI', () => {
    const onPair = jest.fn()
    const { getByPlaceholderText, getByTestId, getByText } = render(<WalletConnectManualEntry onPair={onPair} />)

    fireEvent.changeText(getByPlaceholderText('wc:…'), 'https://example.com')
    fireEvent.press(getByTestId('wc-manual-pair'))

    expect(onPair).not.toHaveBeenCalled()
    expect(getByText(/valid WalletConnect URI/i)).toBeTruthy()
  })

  it('displays an external pairError when provided', () => {
    const { getByText } = render(<WalletConnectManualEntry onPair={jest.fn()} pairError="boom" />)
    expect(getByText('boom')).toBeTruthy()
  })
})
