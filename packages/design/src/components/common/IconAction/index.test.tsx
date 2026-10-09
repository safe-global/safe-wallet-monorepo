import { render, screen } from '@testing-library/react'
import IconAction from '.'

describe('IconAction', () => {
  it('renders an icon-only button with an accessible name', () => {
    render(
      <IconAction aria-label="Search">
        <svg data-testid="icon" />
      </IconAction>,
    )

    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('forwards onClick and other button props', () => {
    render(<IconAction aria-label="Notifications" data-testid="bell" disabled />)

    const button = screen.getByTestId('bell')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-label', 'Notifications')
  })
})
