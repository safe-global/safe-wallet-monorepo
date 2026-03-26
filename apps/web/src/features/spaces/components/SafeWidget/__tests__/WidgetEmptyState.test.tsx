import { render, screen } from '@/tests/test-utils'
import { WidgetEmptyState } from '../WidgetEmptyState'

describe('WidgetEmptyState', () => {
  it('renders the icon and text', () => {
    render(<WidgetEmptyState icon={<span data-testid="test-icon" />} text="No items found" />)

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders the action when provided', () => {
    render(<WidgetEmptyState icon={<span />} text="Empty" action={<button>Do something</button>} />)

    expect(screen.getByRole('button', { name: 'Do something' })).toBeInTheDocument()
  })

  it('does not render an action when not provided', () => {
    render(<WidgetEmptyState icon={<span />} text="Empty" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the subtitle when provided', () => {
    render(<WidgetEmptyState icon={<span />} text="Error occurred" subtitle="Please try again." />)

    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    expect(screen.getByText('Please try again.')).toBeInTheDocument()
  })

  it('does not render the subtitle when not provided', () => {
    render(<WidgetEmptyState icon={<span />} text="No items found" />)

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.queryByText('Please try again.')).not.toBeInTheDocument()
  })
})
