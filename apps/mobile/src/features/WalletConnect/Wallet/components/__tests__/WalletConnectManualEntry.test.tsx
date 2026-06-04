import React from 'react'
import { fireEvent, render, waitFor } from '@/src/tests/test-utils'
import Clipboard from '@react-native-clipboard/clipboard'
import { WalletConnectManualEntry } from '../WalletConnectManualEntry'

jest.mock('@react-native-clipboard/clipboard')

const VALID_URI = 'wc:7f6e9a3c@2?relay-protocol=irn&symKey=abc'

describe('WalletConnectManualEntry', () => {
  beforeEach(() => jest.clearAllMocks())

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

  it('pastes the clipboard contents and pairs when "Paste this" is pressed', async () => {
    ;(Clipboard.getString as jest.Mock).mockResolvedValue(VALID_URI)
    const onPair = jest.fn()
    const { getByPlaceholderText, getByTestId } = render(<WalletConnectManualEntry onPair={onPair} />)

    fireEvent.press(getByTestId('wc-manual-paste'))

    await waitFor(() => expect(onPair).toHaveBeenCalledWith(VALID_URI))
    expect(getByPlaceholderText('wc:…').props.value).toBe(VALID_URI)
  })

  it('clears the input via the clear button, which only shows when there is a value', () => {
    const { getByPlaceholderText, getByTestId, queryByTestId } = render(<WalletConnectManualEntry onPair={jest.fn()} />)

    expect(queryByTestId('wc-manual-clear')).toBeNull()

    fireEvent.changeText(getByPlaceholderText('wc:…'), VALID_URI)
    fireEvent.press(getByTestId('wc-manual-clear'))

    expect(getByPlaceholderText('wc:…').props.value).toBe('')
    expect(queryByTestId('wc-manual-clear')).toBeNull()
  })
})
