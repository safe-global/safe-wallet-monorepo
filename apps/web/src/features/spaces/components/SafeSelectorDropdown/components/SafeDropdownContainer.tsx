import { SelectContent, SelectItem } from '@/components/ui/select'
import SafeItem from './SafeItem'
import type { SafeItemData } from '../types'

export interface SafeDropdownContainerProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect: (itemId: string) => void
}

const SafeDropdownContainer = ({ items, selectedItemId }: SafeDropdownContainerProps) => {
  const filteredItems = items.filter((item) => item.id !== selectedItemId)

  return (
    <SelectContent
      align="start"
      side="bottom"
      alignItemWithTrigger={false}
      className="w-[430px] max-w-[calc(100vw-2rem)] max-h-[14rem] overflow-y-auto bg-card border-0 rounded-3xl px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      sideOffset={20}
      alignOffset={9}
      collisionAvoidance={{ side: 'none', align: 'shift' }}
    >
      {filteredItems.map((item) => (
        <SelectItem
          key={item.id}
          value={item.id}
          className="h-auto py-4 px-4 rounded-3xl my-1 data-[state=checked]:bg-muted hover:bg-muted/50 cursor-pointer"
        >
          <SafeItem {...item} />
        </SelectItem>
      ))}
    </SelectContent>
  )
}

export default SafeDropdownContainer
