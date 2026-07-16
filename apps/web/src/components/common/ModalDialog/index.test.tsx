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
    expect(screen.getByTestId('modal-view')).toHaveClass('translate-x-0', 'translate-y-0')
  })
})
