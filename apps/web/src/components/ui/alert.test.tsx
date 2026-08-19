import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription, AlertAction, AlertSeverityIcon } from './alert'

describe('Alert', () => {
  it('renders as an alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Item added successfully</AlertTitle>
        <AlertDescription>This is an alert with icon, title and description.</AlertDescription>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Item added successfully')
    expect(alert).toHaveTextContent('This is an alert with icon, title and description.')
  })

  it('uses a medium (500) title and normal (400) description weight', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>,
    )

    expect(screen.getByText('Title')).toHaveClass('font-medium')
    expect(screen.getByText('Description')).toHaveClass('font-normal')
  })

  it('breaks long unbroken text so it cannot overflow the container', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>{'a'.repeat(200)}</AlertDescription>
      </Alert>,
    )

    expect(screen.getByText('Title')).toHaveClass('break-words', 'min-w-0')
    expect(screen.getByText('a'.repeat(200))).toHaveClass('break-words', 'min-w-0')
  })

  it('applies the error text color and destructive icon color on the destructive variant', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error! API call failed</AlertTitle>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-card', 'text-foreground')
    expect(alert.className).toContain('*:data-[slot=alert-description]:text-muted-foreground')
    expect(alert.className).toContain('*:[svg]:text-destructive')
  })

  it('renders the borderless error tint on destructive when outlined is false', () => {
    render(
      <Alert variant="destructive" outlined={false}>
        <AlertTitle>Error! API call failed</AlertTitle>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-error-subtle', 'border-transparent', 'text-foreground')
    expect(alert).not.toHaveClass('bg-card')
  })

  it('uses Safe warning semantic tokens and the card surface for the warning variant', () => {
    render(
      <Alert variant="warning">
        <AlertTitle>Pending confirmation</AlertTitle>
        <AlertDescription>Review this transaction before signing.</AlertDescription>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-card', 'text-foreground')
    expect(alert.className).toContain('*:data-[slot=alert-description]:text-muted-foreground')
    expect(alert.className).toContain('*:[svg]:text-warning-accent')
    expect(alert.className).not.toContain('yellow')
  })

  it('renders the borderless warning tint when outlined is false', () => {
    render(
      <Alert variant="warning" outlined={false}>
        <AlertTitle>Pending confirmation</AlertTitle>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-warning-subtle', 'border-transparent', 'text-foreground')
    expect(alert).not.toHaveClass('bg-card')
  })

  it('ignores outlined on variants that have a single design', () => {
    render(
      <Alert variant="info" outlined={false}>
        <AlertTitle>Heads up</AlertTitle>
      </Alert>,
    )

    expect(screen.getByRole('alert')).toHaveClass('bg-[var(--color-info-background)]', 'border-transparent')
  })

  it('applies the info tint and info icon color on the info variant', () => {
    render(
      <Alert variant="info">
        <AlertTitle>Item added successfully</AlertTitle>
      </Alert>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-[var(--color-info-background)]', 'text-foreground', 'border-transparent')
    expect(alert.className).toContain('[&>svg]:text-[var(--color-info-dark)]')
    expect(alert).not.toHaveClass('bg-muted')
  })

  it('renders the action slot anchored to the top right', () => {
    render(
      <Alert>
        <AlertTitle>Item added successfully</AlertTitle>
        <AlertAction>
          <button>Undo</button>
        </AlertAction>
      </Alert>,
    )

    const action = screen.getByRole('button', { name: 'Undo' }).parentElement
    expect(action).toHaveAttribute('data-slot', 'alert-action')
    expect(action).toHaveClass('top-6', '-translate-y-1/2')
  })

  it('does not let the action inherit the variant text color', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error! API call failed</AlertTitle>
        <AlertAction>
          <button>Retry</button>
        </AlertAction>
      </Alert>,
    )

    expect(screen.getByRole('button', { name: 'Retry' }).parentElement).toHaveClass('text-foreground')
  })
})

describe('AlertSeverityIcon', () => {
  it.each([
    ['destructive', 'lucide-circle-alert'],
    ['warning', 'lucide-triangle-alert'],
    ['success', 'lucide-circle-check'],
    ['info', 'lucide-info'],
  ] as const)('renders the standard icon for the %s variant', (variant, iconClass) => {
    const { container } = render(<AlertSeverityIcon variant={variant} />)

    expect(container.querySelector(`svg.${iconClass}`)).toBeInTheDocument()
  })

  it('renders nothing for the default variant, which has no standard icon', () => {
    const { container } = render(<AlertSeverityIcon variant="default" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no variant is given', () => {
    const { container } = render(<AlertSeverityIcon />)

    expect(container).toBeEmptyDOMElement()
  })

  it('forwards props (e.g. className) to the rendered icon', () => {
    render(<AlertSeverityIcon variant="warning" className="size-6" data-testid="severity-icon" />)

    expect(screen.getByTestId('severity-icon')).toHaveClass('size-6', 'lucide-triangle-alert')
  })
})
