import { render, screen, fireEvent } from '@/tests/test-utils'
import { ActionRequiredPanel } from './ActionRequiredPanel'

describe('ActionRequiredPanel', () => {
  it('should render the panel with title', () => {
    render(
      <ActionRequiredPanel>
        <div>Test content</div>
      </ActionRequiredPanel>,
    )

    expect(screen.getByText('Action required')).toBeInTheDocument()
    expect(screen.getByTestId('action-required-panel')).toBeInTheDocument()
  })

  it('should start collapsed by default', () => {
    render(
      <ActionRequiredPanel>
        <div data-testid="warning-content">Warning message</div>
      </ActionRequiredPanel>,
    )

    // Panel should be rendered but collapsed
    const expandButton = screen.getByLabelText('Expand action required panel')
    expect(expandButton).toBeInTheDocument()

    // Content should not be visible initially (panel is collapsed)
    const content = screen.getByTestId('warning-content')
    expect(content).toBeInTheDocument()
    expect(content).not.toBeVisible()
  })

  it('should toggle collapse when header is clicked', () => {
    render(
      <ActionRequiredPanel>
        <div data-testid="warning-content">Warning message</div>
      </ActionRequiredPanel>,
    )

    const header = screen.getByText('Action required').closest('div')

    // Initially collapsed
    const expandButton = screen.getByLabelText('Expand action required panel')
    expect(expandButton).toBeInTheDocument()

    // Click to expand
    if (header) {
      fireEvent.click(header)
    }

    // After expanding, the aria-label should change
    const collapseButton = screen.getByLabelText('Collapse action required panel')
    expect(collapseButton).toBeInTheDocument()
  })

  it('should rotate chevron icon when collapsed/expanded', () => {
    render(
      <ActionRequiredPanel>
        <div>Warning message</div>
      </ActionRequiredPanel>,
    )

    const iconButton = screen.getByLabelText('Expand action required panel')
    const chevronIcon = iconButton.querySelector('svg')

    // Initially collapsed (rotated 0deg)
    expect(chevronIcon).toHaveStyle({ transform: 'rotate(0deg)' })

    // Click to expand
    fireEvent.click(iconButton.closest('div')!)

    // Should rotate to 180deg
    expect(chevronIcon).toHaveStyle({ transform: 'rotate(180deg)' })
  })

  it('should display correct badge count for one warning', async () => {
    render(
      <ActionRequiredPanel>
        <div>Warning 1</div>
      </ActionRequiredPanel>,
    )

    // Wait for useEffect to count warnings
    await screen.findByText('1')
  })

  it('should display correct badge count for multiple warnings', async () => {
    render(
      <ActionRequiredPanel>
        <div>Warning 1</div>
        <div>Warning 2</div>
        <div>Warning 3</div>
      </ActionRequiredPanel>,
    )

    // Wait for useEffect to count warnings
    await screen.findByText('3')
  })

  it('should not display panel when count is zero', () => {
    render(<ActionRequiredPanel>{null}</ActionRequiredPanel>)

    // Panel should not be visible when there are no warnings
    expect(screen.queryByTestId('action-required-panel')).not.toBeInTheDocument()
    expect(screen.queryByText('Action required')).not.toBeInTheDocument()
  })

  it('should handle mixed component types', async () => {
    const ErrorMessageComponent = () => (
      <div style={{ margin: '16px' }} data-testid="error-message">
        Error message
      </div>
    )

    const WidgetComponent = () => (
      <div style={{ padding: '8px' }} data-testid="widget">
        Widget content
      </div>
    )

    render(
      <ActionRequiredPanel>
        <ErrorMessageComponent />
        <WidgetComponent />
      </ActionRequiredPanel>,
    )

    // Both components should render
    expect(screen.getByTestId('error-message')).toBeInTheDocument()
    expect(screen.getByTestId('widget')).toBeInTheDocument()

    // Count should be 2
    await screen.findByText('2')
  })

  it('should handle conditional rendering of warnings', async () => {
    const showWarning1 = true
    const showWarning2 = false
    const showWarning3 = true

    render(
      <ActionRequiredPanel>
        {showWarning1 && <div>Warning 1</div>}
        {showWarning2 && <div>Warning 2</div>}
        {showWarning3 && <div>Warning 3</div>}
      </ActionRequiredPanel>,
    )

    // Only warnings 1 and 3 should be counted
    await screen.findByText('2')
    expect(screen.getByText('Warning 1')).toBeInTheDocument()
    expect(screen.getByText('Warning 3')).toBeInTheDocument()
    expect(screen.queryByText('Warning 2')).not.toBeInTheDocument()
  })

  it('should have correct accessibility attributes', () => {
    render(
      <ActionRequiredPanel>
        <div>Test content</div>
      </ActionRequiredPanel>,
    )

    const panel = screen.getByTestId('action-required-panel')
    // Card with component="section" creates a <section> element
    expect(panel.tagName).toBe('SECTION')

    const expandButton = screen.getByLabelText('Expand action required panel')
    expect(expandButton).toBeInTheDocument()

    // Click to expand
    fireEvent.click(expandButton.closest('div')!)

    // Aria label should update
    const collapseButton = screen.getByLabelText('Collapse action required panel')
    expect(collapseButton).toBeInTheDocument()
  })

  it('should apply correct CSS classes', () => {
    render(
      <ActionRequiredPanel>
        <div>Warning</div>
      </ActionRequiredPanel>,
    )

    // The header class is on the Stack containing the Typography
    const titleElement = screen.getByText('Action required')
    const header = titleElement.closest('.header')
    expect(header).toHaveClass('header')

    // Check that warnings container exists
    const warning = screen.getByText('Warning')
    const container = warning.parentElement
    expect(container).toHaveClass('warningsContainer')
  })
})
