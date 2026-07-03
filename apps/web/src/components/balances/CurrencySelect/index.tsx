import type { ReactElement } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency, setCurrency } from '@/store/settingsSlice'
import useCurrencies from './useCurrencies'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'
import { cn } from '@/utils/cn'

const CurrencySelect = (): ReactElement => {
  const currency = useAppSelector(selectCurrency)
  const dispatch = useAppDispatch()
  const fiatCurrencies = useCurrencies() || [currency.toUpperCase()]

  const handleChange = (value: string | null) => {
    if (value == null) return

    trackEvent({ ...ASSETS_EVENTS.CHANGE_CURRENCY, label: value.toUpperCase() })

    dispatch(setCurrency(value.toLowerCase()))
  }

  const handleOpenChange = (open: boolean) => {
    trackEvent({ ...ASSETS_EVENTS.CURRENCY_MENU, label: open ? 'Open' : 'Close' })
  }

  return (
    <Select value={currency.toUpperCase()} onValueChange={handleChange} onOpenChange={handleOpenChange}>
      <SelectTrigger
        data-testid="currency-selector"
        id="currency"
        size="sm"
        className={cn(
          'min-w-[72px] border-border bg-background px-3 font-medium shadow-none',
          'focus-visible:border-ring focus-visible:ring-ring/50',
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="end"
        side="bottom"
        sideOffset={8}
        alignItemWithTrigger={false}
        className="max-h-80 min-w-[140px] rounded-xl border border-border bg-popover shadow-md ring-0"
      >
        {fiatCurrencies.map((item) => (
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

export default CurrencySelect
