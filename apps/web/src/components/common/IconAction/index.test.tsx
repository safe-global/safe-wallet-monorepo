import { render, screen } from '@testing-library/react'
import IconAction from '.'

describe('IconAction', () => {
  it('renders an icon-only ghost button locked to the compact top-bar scale', () => {
    render(
      <IconAction aria-label="Search">
        <svg data-testid="icon" />
      </IconAction>,
    )

    const button = screen.getByRole('button', { name: 'Search' })
    expect(button).toHaveClass('size-8', 'm-1')
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('forwards onClick and other button props', () => {
    render(<IconAction aria-label="Notifications" data-testid="bell" disabled />)

    const button = screen.getByTestId('bell')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-label', 'Notifications')
  })
})
