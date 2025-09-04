import { render } from '@/src/tests/test-utils'
import { SafeListItem } from '.'
import { Text, View } from 'tamagui'
import { ellipsis } from '@/src/utils/formatters'
import { Alert } from '../Alert'

describe('SafeListItem', () => {
  it('should render the default markup', () => {
    const { getByText } = render(
      <SafeListItem label="A label" leftNode={<Text>Left node</Text>} rightNode={<Text>Right node</Text>} />,
    )

    expect(getByText('A label')).toBeTruthy()
    expect(getByText('Left node')).toBeTruthy()
    expect(getByText('Right node')).toBeTruthy()
  })

  it('should render a list item, with type and icon', () => {
    const { getByText, getByTestId } = render(
      <SafeListItem
        label="A label"
        type="some type"
        icon="add-owner"
        leftNode={<Text>Left node</Text>}
        rightNode={<Text>Right node</Text>}
      />,
    )

    expect(getByText('A label')).toBeTruthy()
    expect(getByText('some type')).toBeTruthy()
    expect(getByTestId('safe-list-add-owner-icon')).toBeTruthy()
    expect(getByText('Left node')).toBeTruthy()
    expect(getByText('Right node')).toBeTruthy()
  })

  it('should render a list item with truncated label when the label text length is very long', () => {
    const text = 'A very long label text to test if it it will truncate, in this case it should truncate.'
    const { getByText, getByTestId } = render(
      <SafeListItem label={text} type="some type" icon="add-owner" leftNode={<Text>Left node</Text>} />,
    )

    expect(getByText(ellipsis(text, 30))).toBeTruthy()
    expect(getByText('some type')).toBeTruthy()
    expect(getByTestId('safe-list-add-owner-icon')).toBeTruthy()
    expect(getByText('Left node')).toBeTruthy()
  })

  it('should render a list item with a custom label template', () => {
    const container = render(
      <SafeListItem
        label={
          <View>
            <Text>Here is my label</Text>
          </View>
        }
        type="some type"
        icon="add-owner"
        leftNode={<Text>Left node</Text>}
      />,
    )

    expect(container.getByText('Here is my label')).toBeTruthy()
    expect(container.getByText('some type')).toBeTruthy()
    expect(container.getByTestId('safe-list-add-owner-icon')).toBeTruthy()
    expect(container.getByText('Left node')).toBeTruthy()

    expect(container).toMatchSnapshot()
  })

  it('should render bottomContent when provided', () => {
    const { getByText } = render(
      <SafeListItem
        label="A label"
        leftNode={<Text>Left node</Text>}
        bottomContent={
          <View testID="bottom-content">
            <Text>Bottom content text</Text>
          </View>
        }
      />,
    )

    expect(getByText('A label')).toBeTruthy()
    expect(getByText('Left node')).toBeTruthy()
    expect(getByText('Bottom content text')).toBeTruthy()
  })

  it('should not render bottomContent when not provided', () => {
    const { queryByTestId } = render(<SafeListItem label="A label" leftNode={<Text>Left node</Text>} />)

    // Since bottomContent is not provided, there should be no bottom content container
    expect(queryByTestId('bottom-content')).toBeNull()
  })

  it('should render bottomContent with proper styling and layout', () => {
    const container = render(
      <SafeListItem
        label="A label"
        leftNode={<Text>Left node</Text>}
        bottomContent={
          <View testID="bottom-content-container">
            <Text testID="bottom-warning">Transaction warning message</Text>
          </View>
        }
      />,
    )

    expect(container.getByText('A label')).toBeTruthy()
    expect(container.getByTestId('bottom-content-container')).toBeTruthy()
    expect(container.getByText('Transaction warning message')).toBeTruthy()

    expect(container).toMatchSnapshot()
  })

  it('should render bottomContent with Alert component', () => {
    const { getByText } = render(
      <SafeListItem
        label="Transaction checks"
        leftNode={<Text>Shield icon</Text>}
        bottomContent={<Alert type="warning" message="Contract Changes Detected!" info="Review Details First" />}
      />,
    )

    expect(getByText('Transaction checks')).toBeTruthy()
    expect(getByText('Shield icon')).toBeTruthy()
    expect(getByText('Contract Changes Detected!')).toBeTruthy()
    expect(getByText('Review Details First')).toBeTruthy()
  })
})

describe('SafeListItem.Header', () => {
  it('should render the default markup', () => {
    const { getByText } = render(<SafeListItem.Header title="any title for your header here" />)

    expect(getByText('any title for your header here')).toBeTruthy()
  })
})
