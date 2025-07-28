import { FlashListProps } from '@shopify/flash-list'
import { useMemo } from 'react'
import { RefreshControl } from 'react-native'
import { Tabs } from 'react-native-collapsible-tab-view'

/**
 * Props for FlashListWithCustomRefresh component.
 * Extends standard FlashListProps with additional customization options.
 */
interface FlashListWithCustomRefreshProps<ItemT> extends FlashListProps<ItemT> {
  /** Optional custom loading indicator to display during refresh operations */
  refreshLoadingIndicator?: React.ReactNode
}

/**
 * A custom FlashList wrapper that provides enhanced refresh control functionality with support
 * for custom loading indicators while maintaining compatibility with Tabs.FlashList.
 *
 * This component extends the standard FlashList behavior by allowing developers to provide
 * a custom refresh indicator that displays while the list is refreshing, while hiding the
 * default system refresh control for a more polished user experience.
 *
 * ## Behavior:
 * - When `refreshLoadingIndicator` is provided, the system refresh control becomes transparent
 * - Custom indicator only shows when `refreshing` is true
 * - Falls back to standard refresh control when no custom indicator is provided
 *
 */
export function FlashListWithCustomRefresh<ItemT>(props: FlashListWithCustomRefreshProps<ItemT>) {
  const { refreshLoadingIndicator, refreshControl, ...restProps } = props

  // Extract refresh props from refreshControl if it exists
  const refreshing = (refreshControl?.props as { refreshing?: boolean })?.refreshing || false
  const onRefresh = (refreshControl?.props as { onRefresh?: () => void })?.onRefresh

  // Create hidden refresh control when custom indicator is provided
  const hiddenRefreshControl = useMemo(() => {
    if (!refreshLoadingIndicator) {
      return refreshControl
    }

    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor="transparent"
        colors={['transparent']}
        progressBackgroundColor="transparent"
        style={{ backgroundColor: 'transparent' }}
      />
    )
  }, [refreshLoadingIndicator, refreshControl, refreshing, onRefresh])

  return (
    <>
      {refreshing && refreshLoadingIndicator}
      <Tabs.FlashList {...restProps} refreshControl={hiddenRefreshControl} />
    </>
  )
}
