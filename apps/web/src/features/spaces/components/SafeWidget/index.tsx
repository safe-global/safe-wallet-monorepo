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

export { SafeWidget }
export default SafeWidget
