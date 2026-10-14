import { SafeWidgetRoot } from '@safe-global/views/features/spaces/components/SafeWidget/SafeWidgetRoot'
import { WidgetItem } from './WidgetItem'
import { WidgetFooter } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetFooter'
import { WidgetViewAll } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetViewAll'
import { WidgetItemSkeleton } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetItemSkeleton'
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
export type { SafeWidgetProps } from '@safe-global/views/features/spaces/components/SafeWidget/SafeWidgetRoot'
export type { WidgetItemProps } from './WidgetItem'
export type { WidgetFooterProps } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetFooter'
export type { WidgetViewAllProps } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetViewAll'
export type { WidgetItemSkeletonProps } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetItemSkeleton'
export type { WidgetEmptyStateProps } from './WidgetEmptyState'
export type { WidgetErrorStateProps } from './WidgetErrorState'
export default SafeWidget
