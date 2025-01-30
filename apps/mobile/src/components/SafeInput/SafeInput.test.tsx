import { render } from '@/src/tests/test-utils'
import { SafeInput } from './SafeInput'
import { Text } from 'tamagui'

describe('SafeInput', () => {
  it('should render the default component', () => {
    const { getByTestId } = render(<SafeInput placeholder="Please enter something..." />)
    const input = getByTestId('safe-input')

    expect(input).toBeDefined()

    expect(input.children[0].props.placeholder).toBe('Please enter something...')
    expect(input.props.style.borderTopColor).toBe('#DCDEE0')
    expect(input.props.style.borderBottomColor).toBe('#DCDEE0')
    expect(input.props.style.borderLeftColor).toBe('#DCDEE0')
    expect(input.props.style.borderRightColor).toBe('#DCDEE0')
  })

  it('should render an error message when an error message is provided', () => {
    const { getByTestId, getByText } = render(<SafeInput error="This field is required" />)
    const input = getByTestId('safe-input')

    expect(input.props.style.borderTopColor).toBe('#FF5F72')
    expect(input.props.style.borderBottomColor).toBe('#FF5F72')
    expect(input.props.style.borderLeftColor).toBe('#FF5F72')
    expect(input.props.style.borderRightColor).toBe('#FF5F72')
    expect(getByText('This field is required')).toBeDefined()
  })

  it('should accept a custom error message component', () => {
    const { getByTestId, getByText } = render(<SafeInput error={<Text>This field is required</Text>} />)
    const input = getByTestId('safe-input')

    expect(input.props.style.borderTopColor).toBe('#FF5F72')
    expect(input.props.style.borderBottomColor).toBe('#FF5F72')
    expect(input.props.style.borderLeftColor).toBe('#FF5F72')
    expect(input.props.style.borderRightColor).toBe('#FF5F72')
    expect(getByText('This field is required')).toBeDefined()
  })

  it('should change the color when a success prop is provided', () => {
    const { getByTestId } = render(<SafeInput success />)
    const input = getByTestId('safe-input')

    expect(input.props.style.borderTopColor).toBe('#12FF80')
    expect(input.props.style.borderBottomColor).toBe('#12FF80')
    expect(input.props.style.borderLeftColor).toBe('#12FF80')
    expect(input.props.style.borderRightColor).toBe('#12FF80')
  })
})
