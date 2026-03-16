import { render, fireEvent } from '@/src/tests/test-utils'
import { ErrorWidget } from './ErrorWidget'

jest.mock('@/src/components/SafeFontIcon', () => ({
  SafeFontIcon: () => 'MockSafeFontIcon',
}))

describe('ErrorWidget', () => {
  it('renders the default error message and subtitle', () => {
    const { getByText } = render(<ErrorWidget />)

    expect(getByText('Unable to load content')).toBeTruthy()
    expect(getByText('Try to reload the page.')).toBeTruthy()
  })

  it('renders a custom error message', () => {
    const { getByText } = render(<ErrorWidget message="Something went wrong" />)

    expect(getByText('Something went wrong')).toBeTruthy()
  })

  it('renders the reload button when onRefresh is provided', () => {
    const { getByText } = render(<ErrorWidget onRefresh={jest.fn()} />)

    expect(getByText('Reload page')).toBeTruthy()
  })

  it('does not render the reload button when onRefresh is not provided', () => {
    const { queryByText } = render(<ErrorWidget />)

    expect(queryByText('Reload page')).toBeNull()
  })

  it('calls onRefresh when the reload button is pressed', () => {
    const onRefresh = jest.fn()
    const { getByText } = render(<ErrorWidget onRefresh={onRefresh} />)

    fireEvent.press(getByText('Reload page'))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
