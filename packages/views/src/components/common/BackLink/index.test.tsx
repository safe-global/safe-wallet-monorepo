import { render, screen, fireEvent } from '@testing-library/react'
import BackLink from './index'

describe('BackLink', () => {
  it('renders children and chevron icon', () => {
    render(
      <BackLink onClick={jest.fn()}>
        <span data-testid="child">A</span>
      </BackLink>,
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByLabelText('Go back')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(
      <BackLink onClick={handleClick}>
        <span>A</span>
      </BackLink>,
    )

    fireEvent.click(screen.getByLabelText('Go back'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders as a button with correct aria-label', () => {
    render(
      <BackLink onClick={jest.fn()}>
        <span>A</span>
      </BackLink>,
    )

    const button = screen.getByRole('button', { name: 'Go back' })
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })
})
