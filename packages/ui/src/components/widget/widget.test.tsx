import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Widget,
  WidgetEmptyState,
  WidgetErrorState,
  WidgetFooter,
  WidgetItem,
  WidgetItemSkeleton,
  WidgetViewAll,
} from './widget'

describe('Widget', () => {
  it('renders the title, the action and the rows, and passes props to the root', () => {
    render(
      <Widget title="Assets" action={<button>More</button>} data-testid="assets-widget">
        <p>Row</p>
      </Widget>,
    )

    expect(screen.getByRole('heading', { level: 4, name: 'Assets' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
    expect(screen.getByTestId('assets-widget')).toHaveTextContent('Row')
  })

  it('renders the title as a button inside the heading with onTitleClick', async () => {
    const onTitleClick = jest.fn()
    render(<Widget title="Pending" onTitleClick={onTitleClick} />)

    const button = screen.getByRole('button', { name: 'Pending' })
    expect(screen.getByRole('heading', { level: 4 })).toContainElement(button)
    await userEvent.click(button)
    button.focus()
    await userEvent.keyboard('{Enter}')

    expect(onTitleClick).toHaveBeenCalledTimes(2)
  })

  it('keeps a plain heading without onTitleClick', () => {
    render(<Widget title="Assets" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('WidgetItem', () => {
  it('renders the label, description and info lines with the slots', () => {
    render(
      <WidgetItem
        label="Ether"
        description="Sent to Payroll"
        info="12.5 ETH"
        startNode={<span data-testid="start" />}
        featuredNode={<span data-testid="featured" />}
        actionNode={<span>$39.95M</span>}
      />,
    )

    for (const text of ['Ether', 'Sent to Payroll', '12.5 ETH', '$39.95M']) expect(screen.getByText(text)).toBeVisible()
    expect(screen.getByTestId('start')).toBeInTheDocument()
    expect(screen.getByTestId('featured')).toBeInTheDocument()
  })

  it('is a plain row without onClick or render', () => {
    render(<WidgetItem label="Treasury" info="0x8675…bca19b" data-testid="row" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByTestId('row')).not.toHaveClass('cursor-pointer')
  })

  it('becomes a button that click, Enter and Space activate with onClick', async () => {
    const onClick = jest.fn()
    render(<WidgetItem label="Treasury" info="0x8675…bca19b" onClick={onClick} />)

    const row = screen.getByRole('button')
    await userEvent.click(row)
    fireEvent.keyDown(row, { key: 'Enter' })
    fireEvent.keyDown(row, { key: ' ' })
    fireEvent.keyDown(row, { key: 'a' })

    expect(onClick).toHaveBeenCalledTimes(3)
    expect(row).toHaveAttribute('tabindex', '0')
  })

  it('leaves clicks and keys on a control inside the row to that control', async () => {
    const onClick = jest.fn()
    const onSign = jest.fn()
    render(
      <WidgetItem
        label="Send"
        info="Treasury"
        onClick={onClick}
        data-testid="row"
        actionNode={<button onClick={onSign}>Sign</button>}
      />,
    )
    const sign = screen.getByRole('button', { name: 'Sign' })

    await userEvent.click(sign)
    fireEvent.keyDown(sign, { key: 'Enter' })

    expect(onSign).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders the given element through render, e.g. a link', () => {
    render(<WidgetItem label="Treasury" info="0x8675…bca19b" render={<a href="/treasury" />} />)

    const link = screen.getByRole('link', { name: /Treasury/ })
    expect(link).toHaveAttribute('href', '/treasury')
    expect(link).toHaveClass('cursor-pointer')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('fixes the action width on request', () => {
    render(<WidgetItem label="Ether" info="12.5 ETH" actionNode={<span>Value</span>} fixedActionWidth />)

    expect(screen.getByText('Value').parentElement).toHaveClass('w-36')
  })
})

describe('WidgetItemSkeleton', () => {
  it('renders the skeleton row', () => {
    const { container } = render(<WidgetItemSkeleton />)

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4)
  })
})

describe('WidgetFooter', () => {
  it('shows the overflow count and the text', () => {
    render(<WidgetFooter count={14} text="View all assets" />)

    expect(screen.getByText('+14')).toHaveClass('bg-widget-count', 'text-widget-count-foreground')
    expect(screen.getByText('View all assets')).toBeInTheDocument()
  })

  it('becomes a pointer button with onClick, and a plain row without', async () => {
    const onClick = jest.fn()
    const { rerender } = render(<WidgetFooter text="View all assets" onClick={onClick} />)

    const footer = screen.getByRole('button')
    expect(footer).toHaveClass('cursor-pointer')
    await userEvent.click(footer)
    fireEvent.keyDown(footer, { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(2)

    rerender(<WidgetFooter text="View all assets" data-testid="footer" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByTestId('footer')).not.toHaveClass('cursor-pointer')
  })

  it('drops the leading slot on request', () => {
    render(<WidgetFooter count={3} text="See more" showLeadingSlot={false} />)

    expect(screen.queryByText('+3')).not.toBeInTheDocument()
  })
})

describe('WidgetViewAll', () => {
  it('renders the count pill and a View all button', async () => {
    const onClick = jest.fn()
    render(<WidgetViewAll count={14} onClick={onClick} />)

    expect(screen.getByText('+14')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'View all' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('hides a zero count and takes a custom label', () => {
    render(<WidgetViewAll count={0} label="See all" />)

    expect(screen.queryByText('+0')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'See all' })).toBeInTheDocument()
  })
})

describe('WidgetEmptyState', () => {
  it('renders the icon, text, subtitle and action', () => {
    render(
      <WidgetEmptyState
        icon={<span data-testid="icon" />}
        text="No accounts yet"
        subtitle="Add a Safe account."
        action={<button>Add account</button>}
      />,
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('No accounts yet')).toBeInTheDocument()
    expect(screen.getByText('Add a Safe account.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add account' })).toBeInTheDocument()
  })

  it('renders no subtitle or action when not given', () => {
    render(<WidgetEmptyState icon={<span />} text="Empty" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('uses the icon halo token unless iconContainerClassName overrides it', () => {
    const { rerender } = render(<WidgetEmptyState icon={<span data-testid="icon" />} text="Empty" />)
    expect(screen.getByTestId('icon').parentElement).toHaveClass('bg-widget-icon-halo')

    rerender(<WidgetEmptyState icon={<span data-testid="icon" />} text="Empty" iconContainerClassName="bg-accent" />)
    expect(screen.getByTestId('icon').parentElement).toHaveClass('bg-accent')
    expect(screen.getByTestId('icon').parentElement).not.toHaveClass('bg-widget-icon-halo')
  })
})

describe('WidgetErrorState', () => {
  it('renders the default message and no reload button', () => {
    render(<WidgetErrorState />)

    expect(screen.getByText('Unable to load content')).toBeInTheDocument()
    expect(screen.getByText('Try to reload the page.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRefresh from the reload button', async () => {
    const onRefresh = jest.fn()
    render(<WidgetErrorState message="Failed to load accounts" onRefresh={onRefresh} reloadLabel="Try again" />)

    expect(screen.getByText('Failed to load accounts')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})

describe('WidgetEmptyState motion', () => {
  const stubMotion = (reduce: boolean) =>
    jest
      .spyOn(window, 'matchMedia')
      .mockImplementation((query) => ({ matches: reduce && query.includes('reduce'), media: query }) as MediaQueryList)
  const icon = (
    <svg>
      <path d="M0 0L10 10" />
    </svg>
  )

  beforeEach(() => {
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', { value: () => 14, configurable: true })
    Object.defineProperty(SVGElement.prototype, 'animate', { value: jest.fn(), configurable: true })
  })
  afterEach(() => jest.restoreAllMocks())

  it('draws the icon stroke in', () => {
    stubMotion(false)
    const { container } = render(<WidgetEmptyState icon={icon} text="Empty" />)

    expect((container.querySelector('path') as unknown as SVGPathElement).animate).toHaveBeenCalled()
  })

  it('skips the stroke animation and the fades with reduced motion', () => {
    stubMotion(true)
    const { container } = render(<WidgetEmptyState icon={icon} text="Empty" />)

    expect((container.querySelector('path') as unknown as SVGPathElement).animate).not.toHaveBeenCalled()
    expect(screen.getByText('Empty').parentElement).toHaveClass('motion-reduce:animate-none')
  })
})
