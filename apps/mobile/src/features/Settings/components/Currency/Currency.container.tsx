import React, { useState, useMemo } from 'react'
import { CurrencyView } from './CurrencyView'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectCurrency, setCurrency } from '@/src/store/settingsSlice'
import useCurrencies from '@/src/hooks/useCurrencies'
import { useRouter } from 'expo-router'
import { getCurrencyName, getCurrencySymbol } from '@/src/utils/currency'

const CRYPTO_CURRENCIES = ['BTC', 'ETH']

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
      const currencyCode = currency.toUpperCase()
      const currencyName = getCurrencyName(currencyCode)
      const currencySymbol = getCurrencySymbol(currencyCode)
      const searchLower = searchQuery.toLowerCase()
      return (
        currency.toLowerCase().includes(searchLower) ||
        currencyName.toLowerCase().includes(searchLower) ||
        currencySymbol.toLowerCase().includes(searchLower)
      )
    })
  }, [supportedCurrencies, searchQuery])

  // Separate crypto and fiat currencies
  const cryptoCurrencies = filteredCurrencies.filter((currency) => CRYPTO_CURRENCIES.includes(currency.toUpperCase()))
  const fiatCurrencies = filteredCurrencies.filter((currency) => !CRYPTO_CURRENCIES.includes(currency.toUpperCase()))

  return (
    <CurrencyView
      selectedCurrency={selectedCurrency}
      cryptoCurrencies={cryptoCurrencies}
      fiatCurrencies={fiatCurrencies}
      onCurrencySelect={handleCurrencySelect}
      onSearchQueryChange={setSearchQuery}
    />
  )
}
