import type { FiatCurrencies } from '@safe-global/store/gateway/types'

export interface CurrencyItemProps {
  code: string
  symbol: string
  name: string
  isSelected: boolean
  onPress: () => void
}

export interface CurrencySectionProps {
  title: string
  currencies: string[]
  selectedCurrency: string
  onCurrencySelect: (currency: string) => void
}

export interface CurrencyViewProps {
  selectedCurrency: string
  cryptoCurrencies: string[]
  fiatCurrencies: string[]
  onCurrencySelect: (currency: string) => void
  onSearchQueryChange: (query: string) => void
}

export interface CurrencyScreenProps {
  selectedCurrency: string
  supportedCurrencies?: FiatCurrencies
  onCurrencySelect: (currency: string) => void
}
