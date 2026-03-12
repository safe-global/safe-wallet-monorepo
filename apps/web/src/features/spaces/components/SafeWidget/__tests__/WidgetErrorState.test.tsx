import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { WidgetErrorState } from '../WidgetErrorState'

describe('WidgetErrorState', () => {
  it('renders the default error message', () => {
    render(<WidgetErrorState />)

    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })

  it('renders a custom error message', () => {
    render(<WidgetErrorState message="Something went wrong" />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders the refresh button when onRefresh is provided', () => {
    render(<WidgetErrorState onRefresh={jest.fn()} />)

    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
  })

  it('does not render the refresh button when onRefresh is not provided', () => {
    render(<WidgetErrorState />)

    expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument()
  })

  it('calls onRefresh when the button is clicked', async () => {
    const onRefresh = jest.fn()
    render(<WidgetErrorState onRefresh={onRefresh} />)

    await userEvent.click(screen.getByRole('button', { name: /refresh/i }))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
