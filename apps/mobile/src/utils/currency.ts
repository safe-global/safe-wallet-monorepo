const cryptoFallBackNames = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
}

export const getCurrencyName = (currency: string, locale = 'en') => {
  try {
    if (typeof Intl.DisplayNames === 'function') {
      const displayNames = new Intl.DisplayNames([locale], { type: 'currency' })
      const name = displayNames.of(currency)
      if (cryptoFallBackNames[name as keyof typeof cryptoFallBackNames]) {
        return cryptoFallBackNames[name as keyof typeof cryptoFallBackNames]
      }
      return name || currency
    }
  } catch (_e) {
    // Fallback to code if Intl.DisplayNames fails
  }
  return currency
}

export const getCurrencySymbol = (currency: string, locale = 'en') => {
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(1)
    // Remove all digits, spaces, and punctuation, leaving the symbol
    const symbol = formatted.replace(/[\d\s.,]/g, '')
    return symbol || currency
  } catch (_e) {
    // Fallback to code if Intl.NumberFormat fails
  }
  return currency
}
