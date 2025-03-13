import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@/src/tests/test-utils'
import { ImportPrivateKey } from './ImportPrivateKey.container'
import { inputTheme } from '@/src/components/SafeInput/theme'

describe('ImportPrivateKey', () => {
  it('renders the import private key screen', () => {
    render(<ImportPrivateKey />)

    expect(screen.getByText('Import a private key')).toBeTruthy()
    expect(
      screen.getByText('Enter your private key below. Make sure to do so in a safe and private place.'),
    ).toBeTruthy()
  })

  it('enables import button when private key is entered', async () => {
    render(<ImportPrivateKey />)

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
      expect(screen.getByTestId('safe-input').children[0].props.value).toBe('test-private-key')
    })
  })
})
