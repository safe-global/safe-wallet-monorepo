import { render, screen, waitFor } from '@testing-library/react'
import TxModalDialog from './index'

describe('TxModalDialog', () => {
  it('should, when a control inside is marked for autofocus, focus it on open', async () => {
    render(
      <TxModalDialog open onClose={jest.fn()}>
        <button type="button">First</button>
        <button type="button" data-autofocus>
          Start here
        </button>
      </TxModalDialog>,
    )

    await waitFor(() => expect(screen.getByRole('button', { name: 'Start here' })).toHaveFocus())
  })

  it('should, when nothing is marked, not move focus to a later control', async () => {
    render(
      <TxModalDialog open onClose={jest.fn()}>
        <button type="button">First</button>
        <button type="button">Later</button>
      </TxModalDialog>,
    )

    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    expect(screen.getByRole('button', { name: 'Later' })).not.toHaveFocus()
  })
})
