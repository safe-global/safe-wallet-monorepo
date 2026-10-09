import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import Popup from './index'

describe('Popup', () => {
  it('renders its children while open', async () => {
    render(<Popup open>Session list</Popup>)

    expect(await screen.findByText('Session list')).toBeInTheDocument()
  })

  // `modal` also makes Base UI render a full-viewport backdrop that swallows the dismissing click, so
  // it cannot also activate the app UI underneath. That needs real hit-testing to observe, so only the
  // scroll lock — which rides on the same flag — is asserted here.
  it('locks background scroll while open', async () => {
    render(<Popup open>Approve this session?</Popup>)

    await screen.findByText('Approve this session?')
    await waitFor(() => expect(document.body).toHaveStyle({ overflow: 'hidden' }))
  })

  it('still closes on an outside press', async () => {
    const onClose = jest.fn()
    render(
      <>
        <button>New transaction</button>
        <Popup open onClose={onClose}>
          Approve this session?
        </Popup>
      </>,
    )

    await screen.findByText('Approve this session?')
    await userEvent.click(screen.getByText('New transaction'))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
