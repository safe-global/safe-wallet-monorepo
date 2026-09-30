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
})
