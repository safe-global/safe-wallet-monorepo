import type { ReactElement } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency, setCurrency } from '@/store/settingsSlice'
import useCurrencies from './useCurrencies'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'

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
        // eslint-disable-next-line no-restricted-syntax -- bg-background is a deliberate flat/outline look (not the card surface); no variant matches
        className="min-w-[72px] bg-background font-medium shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="end"
        side="bottom"
        sideOffset={8}
        alignItemWithTrigger={false}
        className="max-h-80 min-w-[140px]"
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
