import { render, screen } from '@/tests/test-utils'
import EntryDialog from './index'

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

describe('EntryDialog', () => {
  it('renders a create-entry dialog', () => {
    render(<EntryDialog handleClose={jest.fn()} />)

    expect(screen.getByTestId('entry-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create entry')
  })

  /**
   * Rename is opened from three surfaces that are themselves overlays (the Trusted Safes modal, the
   * safe-selector dropdown, the "Manage my account list" dialog). All of them portal into the same
   * container, so at equal z-index the winner is whichever mounted last — the callers raise this
   * dialog explicitly, and the prop carrying that used to be dropped silently on the way through.
   * ModalDialog owns the other half of the contract (a forwarded `z-*` replaces its own).
   */
  it('routes the caller stacking classes to the popup and the backdrop', () => {
    render(<EntryDialog handleClose={jest.fn()} className="popup-marker" overlayClassName="overlay-marker" />)

    const popup = screen.getByTestId('entry-dialog')
    const overlay = document.querySelector('[data-slot="dialog-overlay"]')

    expect(popup).toHaveClass('popup-marker')
    expect(popup).not.toHaveClass('overlay-marker')
    expect(overlay).toHaveClass('overlay-marker')
    expect(overlay).not.toHaveClass('popup-marker')
  })
})
