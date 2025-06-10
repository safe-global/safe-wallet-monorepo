import React, { useState, useMemo } from 'react'
import { CurrencyView } from './CurrencyView'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectCurrency, setCurrency } from '@/src/store/settingsSlice'
import useCurrencies from '@/src/hooks/useCurrencies'
import { useRouter } from 'expo-router'
import { CURRENCY_DATA } from '@/src/config/currencies'

export const CurrencyContainer = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const selectedCurrency = useAppSelector(selectCurrency)
  const supportedCurrencies = useCurrencies()
  const [searchQuery, setSearchQuery] = useState('')

  const handleCurrencySelect = (currency: string) => {
    dispatch(setCurrency(currency))
    router.back()
  }

  // Filter currencies based on search query
  const filteredCurrencies = useMemo(() => {
    if (!supportedCurrencies) {
      return []
    }

    return supportedCurrencies.filter((currency) => {
      const currencyInfo = CURRENCY_DATA[currency.toUpperCase()]
      if (!currencyInfo) {
        return false
      }

      const searchLower = searchQuery.toLowerCase()
      return (
        currency.toLowerCase().includes(searchLower) ||
        currencyInfo.name.toLowerCase().includes(searchLower) ||
        currencyInfo.symbol.toLowerCase().includes(searchLower)
      )
    })
  }, [supportedCurrencies, searchQuery])

  // Separate crypto and fiat currencies
  const cryptoCurrencies = filteredCurrencies.filter((currency) => ['BTC', 'ETH'].includes(currency.toUpperCase()))
  const fiatCurrencies = filteredCurrencies.filter((currency) => !['BTC', 'ETH'].includes(currency.toUpperCase()))

  return (
    <CurrencyView
      selectedCurrency={selectedCurrency}
      cryptoCurrencies={cryptoCurrencies}
      fiatCurrencies={fiatCurrencies}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onCurrencySelect={handleCurrencySelect}
    />
  )
}
