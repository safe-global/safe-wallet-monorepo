import { SafeWidgetRoot } from './SafeWidgetRoot'
import { WidgetItem } from './WidgetItem'
import { WidgetFooter } from './WidgetFooter'
import { WidgetViewAll } from './WidgetViewAll'
import { WidgetItemSkeleton } from './WidgetItemSkeleton'
import { WidgetEmptyState } from './WidgetEmptyState'
import { WidgetErrorState } from './WidgetErrorState'

const SafeWidget = Object.assign(SafeWidgetRoot, {
  Item: WidgetItem,
  Footer: WidgetFooter,
  ViewAll: WidgetViewAll,
  ItemSkeleton: WidgetItemSkeleton,
  EmptyState: WidgetEmptyState,
  ErrorState: WidgetErrorState,
})

export { SafeWidget, WidgetItem, WidgetFooter, WidgetViewAll, WidgetItemSkeleton, WidgetEmptyState, WidgetErrorState }
export type { SafeWidgetProps } from './SafeWidgetRoot'
export type { WidgetItemProps } from './WidgetItem'
export type { WidgetFooterProps } from './WidgetFooter'
export type { WidgetViewAllProps } from './WidgetViewAll'
export type { WidgetItemSkeletonProps } from './WidgetItemSkeleton'
export type { WidgetEmptyStateProps } from './WidgetEmptyState'
export type { WidgetErrorStateProps } from './WidgetErrorState'
export default SafeWidget
