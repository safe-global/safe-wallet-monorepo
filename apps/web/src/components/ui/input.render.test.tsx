import { render, screen } from '@testing-library/react'

import { Input } from './input'

describe('Input invalid state', () => {
  it('marks the field invalid from the error prop', () => {
    render(<Input error="Boom" placeholder="With error" />)

    expect(screen.getByPlaceholderText('With error')).toHaveAttribute('aria-invalid', 'true')
  })

  it('marks the field invalid from an explicit aria-invalid alone', () => {
    render(<Input aria-invalid placeholder="Explicitly invalid" />)

    expect(screen.getByPlaceholderText('Explicitly invalid')).toHaveAttribute('aria-invalid', 'true')
  })

  // The computed attribute used to be overwritten by the `{...props}` spread that followed it, so a
  // caller passing an undefined/false `aria-invalid` alongside `error` silently erased the invalid
  // state. AdvancedOptionsStep passes both and was only safe because they shared one boolean.
  it('keeps the error-driven invalid state when aria-invalid is passed as undefined', () => {
    render(<Input error="Boom" aria-invalid={undefined} placeholder="Undefined aria" />)

    expect(screen.getByPlaceholderText('Undefined aria')).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps the error-driven invalid state when aria-invalid is passed as false', () => {
    render(<Input error="Boom" aria-invalid={false} placeholder="False aria" />)

    expect(screen.getByPlaceholderText('False aria')).toHaveAttribute('aria-invalid', 'true')
  })

  it('leaves a valid field with no aria-invalid attribute', () => {
    render(<Input placeholder="Valid" />)

    expect(screen.getByPlaceholderText('Valid')).not.toHaveAttribute('aria-invalid')
  })
})
