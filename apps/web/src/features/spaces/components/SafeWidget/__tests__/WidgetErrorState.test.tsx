import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { WidgetErrorState } from '../WidgetErrorState'

describe('WidgetErrorState', () => {
  it('renders the default error message', () => {
    render(<WidgetErrorState />)

    expect(screen.getByText('Unable to load content')).toBeInTheDocument()
    expect(screen.getByText('Try to reload the page.')).toBeInTheDocument()
  })

  it('renders a custom error message', () => {
    render(<WidgetErrorState message="Something went wrong" />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders the refresh button when onRefresh is provided', () => {
    render(<WidgetErrorState onRefresh={jest.fn()} />)

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })

  it('does not render the refresh button when onRefresh is not provided', () => {
    render(<WidgetErrorState />)

    expect(screen.queryByRole('button', { name: /reload page/i })).not.toBeInTheDocument()
  })

  it('calls onRefresh when the button is clicked', async () => {
    const onRefresh = jest.fn()
    render(<WidgetErrorState onRefresh={onRefresh} />)

    await userEvent.click(screen.getByRole('button', { name: /reload page/i }))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
