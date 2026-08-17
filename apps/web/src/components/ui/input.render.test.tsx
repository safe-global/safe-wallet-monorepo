import { render, screen } from '@testing-library/react'

import { Input } from './input'
import { Field, FieldLabel } from './field'

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

  it('sets its own text-foreground colour so the typed value never inherits red text', () => {
    render(<Input error="Boom" placeholder="With error" />)

    const input = screen.getByPlaceholderText('With error')
    expect(input).toHaveClass('text-foreground')
    expect(input.className).not.toContain('text-destructive')
  })

  // Reproduces the real bug report: a `Field` ancestor turns red in error state
  // (`data-[invalid=true]:text-destructive` in field.tsx) which, without an explicit colour on the
  // input itself, cascades down via CSS inheritance and turns the typed value red too. The label
  // and border must still redden — only the value text stays neutral.
  it('keeps the value text neutral even nested inside an invalid Field, while the label stays destructive', () => {
    render(
      <Field data-invalid>
        <FieldLabel className="text-destructive">Amount</FieldLabel>
        <Input aria-invalid placeholder="Nested in invalid field" />
      </Field>,
    )

    // The Field wrapper carries `data-[invalid=true]:text-destructive`, which would cascade its red
    // `color` down via CSS inheritance onto any descendant that doesn't set its own — the label
    // opts into that colour explicitly, the input's own `text-foreground` class overrides it.
    expect(screen.getByText('Amount')).toHaveClass('text-destructive')
    expect(screen.getByPlaceholderText('Nested in invalid field')).toHaveClass('text-foreground')
  })
})
