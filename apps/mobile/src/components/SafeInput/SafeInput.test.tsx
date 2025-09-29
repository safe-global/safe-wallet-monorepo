import { render } from '@/src/tests/test-utils'
import { SafeInput } from './SafeInput'
import { Text } from 'tamagui'

describe('SafeInput', () => {
  it('should render the default component', () => {
    const { getByTestId, getByPlaceholderText } = render(<SafeInput placeholder="Please enter something..." />)
    const input = getByTestId('safe-input')

    expect(input).toBeDefined()
    expect(getByPlaceholderText('Please enter something...')).toBeDefined()
  })

  it('should render an error message when an error message is provided', () => {
    const { getByTestId, getByText } = render(<SafeInput error="This field is required" />)
    const input = getByTestId('safe-input')

    expect(input).toBeDefined()
    expect(getByText('This field is required')).toBeDefined()
  })

  it('should accept a custom error message component', () => {
    const { getByTestId, getByText } = render(<SafeInput error={<Text>This field is required</Text>} />)
    const input = getByTestId('safe-input')

    expect(input).toBeDefined()
    expect(getByText('This field is required')).toBeDefined()
  })

  it('should render successfully when success prop is provided', () => {
    const { getByTestId } = render(<SafeInput success />)
    const input = getByTestId('safe-input')

    expect(input).toBeDefined()
  })
})
