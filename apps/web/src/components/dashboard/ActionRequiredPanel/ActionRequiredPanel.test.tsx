import { render, screen, fireEvent } from '@/tests/test-utils'
import { ActionRequiredPanel } from './ActionRequiredPanel'

describe('ActionRequiredPanel', () => {
  // Test helpers
  const helpers = {
    renderPanel: (children: React.ReactNode) => {
      return render(<ActionRequiredPanel>{children}</ActionRequiredPanel>)
    },

    queries: {
      getPanel: () => screen.queryByTestId('action-required-panel'),
      getPanelRequired: () => screen.getByTestId('action-required-panel'),
      getTitle: () => screen.queryByText('Action required'),
      getTitleRequired: () => screen.getByText('Action required'),
      getExpandButton: () => screen.getByLabelText('Expand action required panel'),
      getCollapseButton: () => screen.getByLabelText('Collapse action required panel'),
      getBadgeCount: (count: string) => screen.findByText(count),
      getHeader: () => screen.getByText('Action required').closest('div'),
      getChevronIcon: () => {
        const iconButton = screen.getByLabelText('Expand action required panel')
        return iconButton.querySelector('svg')
      },
    },

    actions: {
      expandPanel: () => {
        const header = helpers.queries.getHeader()
        if (header) {
          fireEvent.click(header)
        }
      },
      clickHeader: () => {
        const header = helpers.queries.getHeader()
        if (header) {
          fireEvent.click(header)
        }
      },
    },

    assertions: {
      expectPanelVisible: () => {
        expect(helpers.queries.getPanelRequired()).toBeInTheDocument()
        expect(helpers.queries.getTitleRequired()).toBeInTheDocument()
      },
      expectPanelHidden: () => {
        const panel = helpers.queries.getPanel()
        expect(panel).toBeInTheDocument()
        expect(panel).not.toBeVisible()
      },
      expectCollapsed: () => {
        expect(helpers.queries.getExpandButton()).toBeInTheDocument()
      },
      expectExpanded: () => {
        expect(helpers.queries.getCollapseButton()).toBeInTheDocument()
      },
    },
  }

  // Test fixtures
  const fixtures = {
    singleWarning: <div data-testid="warning-content">Warning message</div>,
    multipleWarnings: (
      <>
        <div>Warning 1</div>
        <div>Warning 2</div>
        <div>Warning 3</div>
      </>
    ),
    mixedComponents: () => {
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
      return (
        <>
          <ErrorMessageComponent />
          <WidgetComponent />
        </>
      )
    },
  }

  it('should render the panel with title', () => {
    helpers.renderPanel(<div>Test content</div>)

    helpers.assertions.expectPanelVisible()
  })

  it('should start collapsed by default', () => {
    helpers.renderPanel(fixtures.singleWarning)

    helpers.assertions.expectCollapsed()

    // Content should not be visible initially (panel is collapsed)
    const content = screen.getByTestId('warning-content')
    expect(content).toBeInTheDocument()
    expect(content).not.toBeVisible()
  })

  it('should toggle collapse when header is clicked', () => {
    helpers.renderPanel(fixtures.singleWarning)

    // Initially collapsed
    helpers.assertions.expectCollapsed()

    // Click to expand
    helpers.actions.expandPanel()

    // After expanding, the aria-label should change
    helpers.assertions.expectExpanded()
  })

  it('should rotate chevron icon when collapsed/expanded', () => {
    helpers.renderPanel(<div>Warning message</div>)

    const chevronIcon = helpers.queries.getChevronIcon()

    // Initially collapsed (rotated 0deg)
    expect(chevronIcon).toHaveStyle({ transform: 'rotate(0deg)' })

    // Click to expand
    helpers.actions.expandPanel()

    // Should rotate to 180deg
    expect(chevronIcon).toHaveStyle({ transform: 'rotate(180deg)' })
  })

  it('should display correct badge count for one warning', async () => {
    helpers.renderPanel(<div>Warning 1</div>)

    // Wait for useEffect to count warnings
    await helpers.queries.getBadgeCount('1')
  })

  it('should display correct badge count for multiple warnings', async () => {
    helpers.renderPanel(fixtures.multipleWarnings)

    // Wait for useEffect to count warnings
    await helpers.queries.getBadgeCount('3')
  })

  it('should not display panel when count is zero', () => {
    helpers.renderPanel(null)

    // Panel should not be visible when there are no warnings
    helpers.assertions.expectPanelHidden()
  })

  it('should handle mixed component types', async () => {
    helpers.renderPanel(fixtures.mixedComponents())

    // Both components should render
    expect(screen.getByTestId('error-message')).toBeInTheDocument()
    expect(screen.getByTestId('widget')).toBeInTheDocument()

    // Count should be 2
    await helpers.queries.getBadgeCount('2')
  })

  it('should handle conditional rendering of warnings', async () => {
    const showWarning1 = true
    const showWarning2 = false
    const showWarning3 = true

    helpers.renderPanel(
      <>
        {showWarning1 && <div>Warning 1</div>}
        {showWarning2 && <div>Warning 2</div>}
        {showWarning3 && <div>Warning 3</div>}
      </>,
    )

    // Only warnings 1 and 3 should be counted
    await helpers.queries.getBadgeCount('2')
    expect(screen.getByText('Warning 1')).toBeInTheDocument()
    expect(screen.getByText('Warning 3')).toBeInTheDocument()
    expect(screen.queryByText('Warning 2')).not.toBeInTheDocument()
  })

  it('should have correct accessibility attributes', () => {
    helpers.renderPanel(<div>Test content</div>)

    const panel = helpers.queries.getPanelRequired()
    // Card with component="section" creates a <section> element
    expect(panel.tagName).toBe('SECTION')

    helpers.assertions.expectCollapsed()

    // Click to expand
    helpers.actions.expandPanel()

    // Aria label should update
    helpers.assertions.expectExpanded()
  })

  it('should apply correct CSS classes', () => {
    helpers.renderPanel(<div>Warning</div>)

    // The header class is on the Stack containing the Typography
    const titleElement = helpers.queries.getTitleRequired()
    const header = titleElement.closest('.header')
    expect(header).toHaveClass('header')

    // Check that warnings container exists
    const warning = screen.getByText('Warning')
    const container = warning.parentElement
    expect(container).toHaveClass('warningsContainer')
  })
})
