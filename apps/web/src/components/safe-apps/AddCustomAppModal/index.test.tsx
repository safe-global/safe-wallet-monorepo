import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { AddCustomAppModal } from '.'

jest.mock('@/services/safe-apps/manifest', () => ({
  fetchSafeAppFromManifest: jest.fn(() => Promise.resolve(undefined)),
}))

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  safeAppsList: [{ url: 'https://listed-app.com' } as SafeAppData],
}

describe('AddCustomAppModal', () => {
  it('shows an error message when the URL is invalid', async () => {
    render(<AddCustomAppModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/Safe App URL/i), { target: { value: 'not-a-url' } })

    expect(await screen.findByRole('alert')).toHaveTextContent('The url is invalid')
  })

  it('shows an error message when the URL is cleared', async () => {
    render(<AddCustomAppModal {...defaultProps} />)

    const input = screen.getByLabelText(/Safe App URL/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    // Flush the async validation of the first change before clearing, as a user typing would
    await act(async () => {})
    fireEvent.change(input, { target: { value: '' } })

    expect(await screen.findByRole('alert')).toHaveTextContent('URL is required')
  })

  it('does not show a field error when the app is already in the list', async () => {
    render(<AddCustomAppModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/Safe App URL/i), { target: { value: 'https://listed-app.com' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
