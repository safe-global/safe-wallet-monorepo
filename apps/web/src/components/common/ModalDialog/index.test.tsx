import { render, screen } from '@testing-library/react'
import ModalDialog from './index'

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

describe('ModalDialog', () => {
  it('removes the dialog centering translate when rendered full-screen', () => {
    render(
      <ModalDialog open fullScreen>
        <p>Full-screen content</p>
      </ModalDialog>,
    )

    expect(screen.getByTestId('modal-view')).toHaveStyle({
      top: '0px',
      left: '0px',
      transform: 'none',
    })
  })

  // A forwarded z-* has to replace the DialogContent variant's own z-index rather than sit
  // alongside it, otherwise dialogs cannot be lifted above third-party overlays.
  it('forwards stacking classes to the popup and the backdrop, replacing the defaults', () => {
    render(
      <ModalDialog open className="z-[1451]" overlayClassName="z-[1451]">
        <p>Content</p>
      </ModalDialog>,
    )

    const popup = screen.getByTestId('modal-view')
    const overlay = document.querySelector('[data-slot="dialog-overlay"]')

    expect(popup).toHaveClass('z-[1451]')
    expect(popup).not.toHaveClass('z-[var(--z-overlay)]')
    expect(overlay).toHaveClass('z-[1451]')
    expect(overlay).not.toHaveClass('z-[var(--z-overlay)]')
  })
})
