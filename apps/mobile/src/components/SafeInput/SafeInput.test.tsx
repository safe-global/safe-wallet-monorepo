import { render } from '@/src/tests/test-utils'
import { SafeInput } from './SafeInput'
import { Text } from 'tamagui'
import { inputTheme } from './theme'

describe('SafeInput', () => {
  it('should render the default component', () => {
    const { getByTestId } = render(<SafeInput placeholder="Please enter something..." />)
    const input = getByTestId('safe-input')

    expect(input).toBeDefined()

    expect(input.children[0].props.placeholder).toBe('Please enter something...')
    expect(input.props.style.borderTopColor).toBe(inputTheme.light_input_default.borderColor.val)
    expect(input.props.style.borderBottomColor).toBe(inputTheme.light_input_default.borderColor.val)
    expect(input.props.style.borderLeftColor).toBe(inputTheme.light_input_default.borderColor.val)
    expect(input.props.style.borderRightColor).toBe(inputTheme.light_input_default.borderColor.val)
  })

  it('should render an error message when an error message is provided', () => {
    const { getByTestId, getByText } = render(<SafeInput error="This field is required" />)
    const input = getByTestId('safe-input')

    expect(input.props.style.borderTopColor).toBe(inputTheme.light_input_error.borderColor.val)
    expect(input.props.style.borderBottomColor).toBe(inputTheme.light_input_error.borderColor.val)
    expect(input.props.style.borderLeftColor).toBe(inputTheme.light_input_error.borderColor.val)
    expect(input.props.style.borderRightColor).toBe(inputTheme.light_input_error.borderColor.val)
    expect(getByText('This field is required')).toBeDefined()
  })

  it('should accept a custom error message component', () => {
    const { getByTestId, getByText } = render(<SafeInput error={<Text>This field is required</Text>} />)
    const input = getByTestId('safe-input')

    expect(input.props.style.borderTopColor).toBe(inputTheme.light_input_error.borderColor.val)
    expect(input.props.style.borderBottomColor).toBe(inputTheme.light_input_error.borderColor.val)
    expect(input.props.style.borderLeftColor).toBe(inputTheme.light_input_error.borderColor.val)
    expect(input.props.style.borderRightColor).toBe(inputTheme.light_input_error.borderColor.val)
    expect(getByText('This field is required')).toBeDefined()
  })

  it('should change the color when a success prop is provided', () => {
    const { getByTestId } = render(<SafeInput success />)
    const input = getByTestId('safe-input')

    expect(input.props.style.borderTopColor).toBe(inputTheme.light_input_success.borderColor.val)
    expect(input.props.style.borderBottomColor).toBe(inputTheme.light_input_success.borderColor.val)
    expect(input.props.style.borderLeftColor).toBe(inputTheme.light_input_success.borderColor.val)
    expect(input.props.style.borderRightColor).toBe(inputTheme.light_input_success.borderColor.val)
  })
})
