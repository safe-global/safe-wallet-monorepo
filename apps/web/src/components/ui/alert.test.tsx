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
    expect(alert).toHaveClass('border-warning-muted')
    expect(alert.className).not.toContain('yellow')
    // The tint and the icon carry the severity; body copy keeps the default foreground, as MUI's
    // `<Alert severity>` did. `--color-warning-dark` as ink is only 3.14:1 on this tint in dark mode.
    expect(alert).toHaveClass('text-foreground')
    expect(alert.className).not.toContain('text-warning-strong ')
  })
})
