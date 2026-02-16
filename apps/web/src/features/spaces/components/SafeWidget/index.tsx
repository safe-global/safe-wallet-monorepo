import { SafeWidgetRoot } from './SafeWidgetRoot'
import { WidgetItem } from './WidgetItem'
import { WidgetFooter } from './WidgetFooter'

const SafeWidget = Object.assign(SafeWidgetRoot, {
  Item: WidgetItem,
  Footer: WidgetFooter,
})

export { SafeWidget, WidgetItem, WidgetFooter }
export type { SafeWidgetProps } from './SafeWidgetRoot'
export type { WidgetItemProps } from './WidgetItem'
export type { WidgetFooterProps } from './WidgetFooter'
export default SafeWidget
