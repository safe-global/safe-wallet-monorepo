import React from 'react'
import { fireEvent, render, waitFor } from '@/src/tests/test-utils'
import { WalletConnectManualEntryContainer } from '../WalletConnectManualEntry.container'

const VALID_URI = 'wc:7f6e9a3c@2?relay-protocol=irn&symKey=abc'
const mockDismiss = jest.fn()
const mockPair = jest.fn()

jest.mock('expo-router', () => ({ useRouter: () => ({ dismiss: mockDismiss }) }))
jest.mock('../../walletKit', () => ({ getWalletKit: () => Promise.resolve({ pair: mockPair }) }))

describe('WalletConnectManualEntryContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPair.mockResolvedValue(undefined)
  })

  it('pairs the entered URI and dismisses both the manual entry and the scanner on success', async () => {
    const { getByPlaceholderText, getByTestId } = render(<WalletConnectManualEntryContainer />)
    fireEvent.changeText(getByPlaceholderText('wc:…'), VALID_URI)
    fireEvent.press(getByTestId('wc-manual-pair'))
    await waitFor(() => expect(mockPair).toHaveBeenCalledWith({ uri: VALID_URI }))
    await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith(2))
  })

  it('shows the pairing error and does not navigate on failure', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    mockPair.mockRejectedValueOnce(new Error('pair boom'))
    const { getByPlaceholderText, getByTestId, getByText } = render(<WalletConnectManualEntryContainer />)
    fireEvent.changeText(getByPlaceholderText('wc:…'), VALID_URI)
    fireEvent.press(getByTestId('wc-manual-pair'))
    await waitFor(() => expect(getByText('pair boom')).toBeTruthy())
    expect(mockDismiss).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
