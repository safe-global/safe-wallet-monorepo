import type { ReactElement } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency, setCurrency } from '@/store/settingsSlice'
import useCurrencies from './useCurrencies'
import { trackEvent, ASSETS_EVENTS } from '@/services/analytics'
import { CurrencySelectView } from '@views/components/balances/CurrencySelect/CurrencySelectView'

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
    <CurrencySelectView
      value={currency.toUpperCase()}
      currencies={fiatCurrencies}
      onValueChange={handleChange}
      onOpenChange={handleOpenChange}
    />
  )
}

export default CurrencySelect
