import { SafeWidgetRoot } from '@views/features/spaces/components/SafeWidget/SafeWidgetRoot'
import { WidgetItem } from './WidgetItem'
import { WidgetFooter } from '@views/features/spaces/components/SafeWidget/WidgetFooter'
import { WidgetViewAll } from '@views/features/spaces/components/SafeWidget/WidgetViewAll'
import { WidgetItemSkeleton } from '@views/features/spaces/components/SafeWidget/WidgetItemSkeleton'
import { WidgetEmptyState } from '@views/features/spaces/components/SafeWidget/WidgetEmptyState'
import { WidgetErrorState } from '@views/features/spaces/components/SafeWidget/WidgetErrorState'

const SafeWidget = Object.assign(SafeWidgetRoot, {
  Item: WidgetItem,
  Footer: WidgetFooter,
  ViewAll: WidgetViewAll,
  ItemSkeleton: WidgetItemSkeleton,
  EmptyState: WidgetEmptyState,
  ErrorState: WidgetErrorState,
})

export { SafeWidget, WidgetItem, WidgetFooter, WidgetViewAll, WidgetItemSkeleton, WidgetEmptyState, WidgetErrorState }
export type { SafeWidgetProps } from '@views/features/spaces/components/SafeWidget/SafeWidgetRoot'
export type { WidgetItemProps } from './WidgetItem'
export type { WidgetFooterProps } from '@views/features/spaces/components/SafeWidget/WidgetFooter'
export type { WidgetViewAllProps } from '@views/features/spaces/components/SafeWidget/WidgetViewAll'
export type { WidgetItemSkeletonProps } from '@views/features/spaces/components/SafeWidget/WidgetItemSkeleton'
export type { WidgetEmptyStateProps } from '@views/features/spaces/components/SafeWidget/WidgetEmptyState'
export type { WidgetErrorStateProps } from '@views/features/spaces/components/SafeWidget/WidgetErrorState'
export default SafeWidget
