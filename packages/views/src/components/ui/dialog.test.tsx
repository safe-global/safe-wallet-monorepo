import { render, screen } from '@testing-library/react'
import { Dialog, DialogContent } from './dialog'

describe('DialogContent', () => {
  it('routes overlayClassName to the backdrop and className to the popup', () => {
    render(
      <Dialog open>
        <DialogContent data-testid="content" className="z-[1451]" overlayClassName="z-[1452]" showCloseButton={false}>
          Body
        </DialogContent>
      </Dialog>,
    )

    const content = screen.getByTestId('content')
    const overlay = document.querySelector('[data-slot="dialog-overlay"]')

    expect(content).toHaveClass('z-[1451]')
    expect(content).not.toHaveClass('z-[1452]')
    expect(overlay).toHaveClass('z-[1452]')
    expect(overlay).not.toHaveClass('z-[1451]')
  })

  it.each([
    [false, 1],
    [true, 2],
  ])('renders the backdrop of a nested dialog only when forceBackdrop is %s', (forceBackdrop, expectedOverlays) => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          Parent
          <Dialog open>
            <DialogContent showCloseButton={false} forceBackdrop={forceBackdrop}>
              Child
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>,
    )

    expect(document.querySelectorAll('[data-slot="dialog-overlay"]')).toHaveLength(expectedOverlays)
  })
})
