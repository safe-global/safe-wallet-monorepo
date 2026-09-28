import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@/src/tests/test-utils'
import { ImportSigner } from './ImportSigner.container'
import { inputTheme } from '@/src/components/SafeInput/theme'
import { ethers } from 'ethers'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import { KeyStorageError } from '@/src/services/key-storage/errors'

jest.mock('@/src/hooks/useSign/useSign')
jest.mock('@/src/hooks/useDelegate', () => ({
  __esModule: true,
  default: () => ({ createDelegate: jest.fn().mockResolvedValue({ success: true }) }),
}))

describe('ImportSigner', () => {
  it('allows retrying after biometric cancellation without editing the private key', async () => {
    const privateKey = ethers.Wallet.createRandom().privateKey
    const cancelled = new KeyStorageError(new Error('Status: -128'))
    jest.mocked(storePrivateKey).mockRejectedValueOnce(cancelled).mockResolvedValueOnce(undefined)
    render(<ImportSigner />)
    const input = screen.getByPlaceholderText('Paste here or type...')
    const button = screen.getByTestId('import-signer-button')

    fireEvent.changeText(input, privateKey)
    await act(async () => fireEvent.press(button))

    expect(screen.getByText(cancelled.message)).toBeTruthy()
    expect(screen.getByDisplayValue(privateKey)).toBeTruthy()
    expect(button).toBeEnabled()

    await act(async () => fireEvent.press(button))

    expect(storePrivateKey).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(cancelled.message)).toBeNull()
  })

  it('keeps empty or invalid input disabled', () => {
    render(<ImportSigner />)
    const button = screen.getByTestId('import-signer-button')
    expect(button).toBeDisabled()

    fireEvent.changeText(screen.getByPlaceholderText('Paste here or type...'), 'invalid key')

    expect(button).toBeDisabled()
  })

  it('renders the import signer screen', () => {
    render(<ImportSigner />)

    expect(screen.getByText('Import a signer')).toBeTruthy()
    expect(
      screen.getByText('Enter your private key or seed phrase below. Make sure to do so in a safe and private place.'),
    ).toBeTruthy()
  })

  it('enables import button when private key is entered', async () => {
    render(<ImportSigner />)

    const input = screen.getByPlaceholderText('Paste here or type...')
    const button = screen.getByText('Import signer')

    await act(() => fireEvent.press(button))

    await waitFor(() => {
      expect(screen.getByTestId('safe-input').props.style.borderTopColor).toBe(
        inputTheme.light_input_error.borderColor.val,
      )
      expect(screen.getByTestId('safe-input').props.style.borderBottomColor).toBe(
        inputTheme.light_input_error.borderColor.val,
      )
      expect(screen.getByTestId('safe-input').props.style.borderLeftColor).toBe(
        inputTheme.light_input_error.borderColor.val,
      )
      expect(screen.getByTestId('safe-input').props.style.borderRightColor).toBe(
        inputTheme.light_input_error.borderColor.val,
      )
    })

    act(() => fireEvent.changeText(input, 'test-private-key'))

    await waitFor(() => {
      expect(screen.getByDisplayValue('test-private-key')).toBeTruthy()
    })
  })
})
