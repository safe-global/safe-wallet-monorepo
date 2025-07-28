import React from 'react'
import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { FlashListProps } from '@shopify/flash-list'

// Simple mocks that don't interfere with imports
jest.mock('react-native-collapsible-tab-view', () => ({
  Tabs: {
    FlashList: function <ItemT>({ testID = 'flash-list', refreshControl, ...props }: FlashListProps<ItemT>) {
      const { View } = require('react-native')
      return (
        <View testID={testID} {...props}>
          {refreshControl}
        </View>
      )
    },
  },
}))

// Import the component after mocking its dependencies
import { FlashListWithCustomRefresh } from './FlashListWithCustomRefresh'

describe('FlashListWithCustomRefresh', () => {
  const mockData = [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
  ]

  const mockRenderItem = ({ item }: { item: { id: string; title: string } }) => (
    <Text testID={`item-${item.id}`}>{item.title}</Text>
  )

  const mockOnRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('renders FlashList with basic props', () => {
      const { getByTestId } = render(
        <FlashListWithCustomRefresh data={mockData} renderItem={mockRenderItem} keyExtractor={(item) => item.id} />,
      )

      expect(getByTestId('flash-list')).toBeTruthy()
    })

    it('forwards all props to the underlying FlashList', () => {
      const estimatedItemSize = 100
      const { getByTestId } = render(
        <FlashListWithCustomRefresh
          data={mockData}
          renderItem={mockRenderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={estimatedItemSize}
          testID="custom-flash-list"
        />,
      )

      const flashList = getByTestId('custom-flash-list')
      expect(flashList.props.data).toEqual(mockData)
      expect(flashList.props.estimatedItemSize).toBe(estimatedItemSize)
    })
  })

  describe('Refresh control behavior', () => {
    it('uses the provided refresh control when no custom indicator is provided', () => {
      const TestRefreshControl = ({ testID }: { testID: string }) => <Text testID={testID}>Refresh Control</Text>

      const { getByTestId, queryByTestId } = render(
        <FlashListWithCustomRefresh
          data={mockData}
          renderItem={mockRenderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<TestRefreshControl testID="original-refresh-control" />}
        />,
      )

      // Should use the original refresh control
      expect(getByTestId('original-refresh-control')).toBeTruthy()
      // Should not show custom indicator
      expect(queryByTestId('custom-indicator')).toBeNull()
    })

    it('shows custom indicator when refreshing is true', () => {
      const customIndicator = <Text testID="custom-indicator">Loading...</Text>

      const { getByTestId } = render(
        <FlashListWithCustomRefresh
          data={mockData}
          renderItem={mockRenderItem}
          keyExtractor={(item) => item.id}
          refreshControl={React.createElement('RefreshControl', {
            refreshing: true,
            onRefresh: mockOnRefresh,
          })}
          refreshLoadingIndicator={customIndicator}
        />,
      )

      expect(getByTestId('custom-indicator')).toBeTruthy()
    })

    it('hides custom indicator when refreshing is false', () => {
      const customIndicator = <Text testID="custom-indicator">Loading...</Text>

      const { queryByTestId } = render(
        <FlashListWithCustomRefresh
          data={mockData}
          renderItem={mockRenderItem}
          keyExtractor={(item) => item.id}
          refreshControl={React.createElement('RefreshControl', {
            refreshing: false,
            onRefresh: mockOnRefresh,
          })}
          refreshLoadingIndicator={customIndicator}
        />,
      )

      expect(queryByTestId('custom-indicator')).toBeNull()
    })
  })

  it('hides custom indicator when no refresh control is provided', () => {
    const customIndicator = <Text testID="custom-indicator">Loading...</Text>

    const { queryByTestId } = render(
      <FlashListWithCustomRefresh
        data={mockData}
        renderItem={mockRenderItem}
        keyExtractor={(item) => item.id}
        refreshLoadingIndicator={customIndicator}
      />,
    )

    expect(queryByTestId('custom-indicator')).toBeNull()
  })
})
