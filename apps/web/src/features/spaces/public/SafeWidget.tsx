import { SafeWidgetRoot } from '@safe-global/views/features/spaces/components/SafeWidget/SafeWidgetRoot'
import { WidgetItem } from '../components/SafeWidget/WidgetItem'
import { WidgetFooter } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetFooter'
import { WidgetViewAll } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetViewAll'
import { WidgetItemSkeleton } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetItemSkeleton'
import { WidgetEmptyState } from '../components/SafeWidget/WidgetEmptyState'
import { WidgetErrorState } from '../components/SafeWidget/WidgetErrorState'

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
export type { WidgetItemProps } from '../components/SafeWidget/WidgetItem'
export type { WidgetFooterProps } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetFooter'
export type { WidgetViewAllProps } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetViewAll'
export type { WidgetItemSkeletonProps } from '@safe-global/views/features/spaces/components/SafeWidget/WidgetItemSkeleton'
export type { WidgetEmptyStateProps } from '../components/SafeWidget/WidgetEmptyState'
export type { WidgetErrorStateProps } from '../components/SafeWidget/WidgetErrorState'
export default SafeWidget
