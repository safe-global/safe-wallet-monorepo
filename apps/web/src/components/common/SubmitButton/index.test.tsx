import { render, screen } from '@testing-library/react'
import SubmitButton from '.'

describe('SubmitButton', () => {
  it('renders its label as a submit-typed button locked to the submit size', () => {
    render(<SubmitButton>Save</SubmitButton>)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveClass('min-w-[7rem]', 'h-10')
  })

  it('forwards the disabled prop', () => {
    render(<SubmitButton disabled>Save</SubmitButton>)

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('swaps the label for a spinner and disables the button while loading', () => {
    render(<SubmitButton loading>Save</SubmitButton>)

    expect(screen.queryByText('Save')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('stretches to the container width when fullWidth', () => {
    render(<SubmitButton fullWidth>Save</SubmitButton>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('w-full')
  })
})
