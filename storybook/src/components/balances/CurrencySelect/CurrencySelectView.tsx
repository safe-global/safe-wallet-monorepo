import type { ReactElement } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type CurrencySelectViewProps = {
  value: string
  currencies: string[]
  onValueChange: (value: string | null) => void
  onOpenChange: (open: boolean) => void
}

export const CurrencySelectView = ({
  value,
  currencies,
  onValueChange,
  onOpenChange,
}: CurrencySelectViewProps): ReactElement => {
  return (
    <Select value={value} onValueChange={onValueChange} onOpenChange={onOpenChange}>
      {/* Matches the ManageTokensButton (outline, sm) it shares the assets toolbar row with */}
      <SelectTrigger data-testid="currency-selector" id="currency" variant="outline" size="sm" className="min-w-[72px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="end"
        side="bottom"
        sideOffset={8}
        alignItemWithTrigger={false}
        className="max-h-80 min-w-[140px]"
      >
        {currencies.map((item) => (
          <SelectItem
            data-testid="currency-item"
            key={item}
            value={item}
            className="min-h-10 rounded-lg px-3 py-2.5 pr-9 text-sm focus:bg-muted data-[highlighted]:bg-muted"
          >
            {item.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
