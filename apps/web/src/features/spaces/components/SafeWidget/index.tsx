import { SafeWidgetRoot } from './SafeWidgetRoot'
import { WidgetItem } from './WidgetItem'
import { WidgetFooter } from './WidgetFooter'
import { WidgetItemSkeleton } from './WidgetItemSkeleton'

const SafeWidget = Object.assign(SafeWidgetRoot, {
  Item: WidgetItem,
  Footer: WidgetFooter,
  ItemSkeleton: WidgetItemSkeleton,
})

export { SafeWidget, WidgetItem, WidgetFooter, WidgetItemSkeleton }
export type { SafeWidgetProps } from './SafeWidgetRoot'
export type { WidgetItemProps } from './WidgetItem'
export type { WidgetFooterProps } from './WidgetFooter'
export type { WidgetItemSkeletonProps } from './WidgetItemSkeleton'
export default SafeWidget
