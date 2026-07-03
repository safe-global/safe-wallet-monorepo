import { render, screen } from '@testing-library/react'
import { Alert, AlertDescription } from './alert'

describe('Alert', () => {
  it('uses Safe warning semantic tokens for the warning variant', () => {
    render(
      <Alert variant="warning">
        <AlertDescription>Review this transaction before signing.</AlertDescription>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-warning-subtle')
    expect(alert).toHaveClass('text-warning-strong')
    expect(alert).toHaveClass('border-warning-muted')
    expect(alert.className).not.toContain('yellow')
  })
})
