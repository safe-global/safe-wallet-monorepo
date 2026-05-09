import { SafeWidgetRoot } from './SafeWidgetRoot'
import { WidgetItem } from './WidgetItem'
import { WidgetFooter } from './WidgetFooter'
import { WidgetItemSkeleton } from './WidgetItemSkeleton'
import { WidgetEmptyState } from './WidgetEmptyState'
import { WidgetErrorState } from './WidgetErrorState'

const SafeWidget = Object.assign(SafeWidgetRoot, {
  Item: WidgetItem,
  Footer: WidgetFooter,
  ItemSkeleton: WidgetItemSkeleton,
  EmptyState: WidgetEmptyState,
  ErrorState: WidgetErrorState,
})

export { SafeWidget, WidgetItem, WidgetFooter, WidgetItemSkeleton, WidgetEmptyState, WidgetErrorState }
export type { SafeWidgetProps } from './SafeWidgetRoot'
export type { WidgetItemProps } from './WidgetItem'
export type { WidgetFooterProps } from './WidgetFooter'
export type { WidgetItemSkeletonProps } from './WidgetItemSkeleton'
export type { WidgetEmptyStateProps } from './WidgetEmptyState'
export type { WidgetErrorStateProps } from './WidgetErrorState'
export default SafeWidget
