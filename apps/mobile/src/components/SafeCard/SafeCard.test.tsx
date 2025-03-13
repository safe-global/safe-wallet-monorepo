import { render } from '@/src/tests/test-utils'
import { SafeCard } from './SafeCard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Text } from 'tamagui'

describe('SafeCard', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test Description',
  }

  it('renders basic card with title and description', () => {
    const { getByText } = render(<SafeCard {...defaultProps} />)

    expect(getByText('Test Title')).toBeTruthy()
    expect(getByText('Test Description')).toBeTruthy()
  })

  it('renders with icon', () => {
    const { getByTestId } = render(
      <SafeCard {...defaultProps} icon={<SafeFontIcon testID="test-icon" name="safe" size={24} />} />,
    )

    expect(getByTestId('test-icon')).toBeTruthy()
  })

  it('renders with image', () => {
    const testImage = { uri: 'test-image.png' }
    const { getByTestId } = render(<SafeCard {...defaultProps} image={testImage} />)

    expect(getByTestId('safe-card-image')).toBeTruthy()
  })

  it('renders with children', () => {
    const { getByText } = render(
      <SafeCard {...defaultProps}>
        <Text>Child Content</Text>
      </SafeCard>,
    )

    expect(getByText('Child Content')).toBeTruthy()
  })

  it('renders all optional elements together', () => {
    const testImage = { uri: 'test-image.png' }
    const { getByTestId, getByText } = render(
      <SafeCard {...defaultProps} icon={<SafeFontIcon testID="test-icon" name="safe" size={24} />} image={testImage}>
        <Text>Child Content</Text>
      </SafeCard>,
    )

    expect(getByTestId('test-icon')).toBeTruthy()
    expect(getByTestId('safe-card-image')).toBeTruthy()
    expect(getByText('Child Content')).toBeTruthy()
  })
})
