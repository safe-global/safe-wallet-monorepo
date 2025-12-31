import type { CSSProperties, ReactElement } from 'react'
import { useMemo } from 'react'
import { Typography } from '@mui/material'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'

const style = { whiteSpace: 'nowrap' } as CSSProperties

const FiatValue = ({
  value,
  maxLength,
  precise,
  mode = 'value',
}: {
  value: string | number | null
  maxLength?: number
  precise?: boolean
  mode?: 'value' | 'price'
}): ReactElement => {
  const currency = useAppSelector(selectCurrency)

  const fiat = useMemo(() => {
    return value != null ? formatCurrency(value, currency, maxLength, mode) : null
  }, [value, currency, maxLength, mode])

  const preciseFiat = useMemo(() => {
    return value != null ? formatCurrencyPrecise(value, currency) : null
  }, [value, currency])

  const [whole, decimals, endCurrency] = useMemo(() => {
    const match = (preciseFiat ?? '').match(/(.+)(\D\d+)(\D+)?$/)
    return match ? match.slice(1) : ['', preciseFiat, '', '']
  }, [preciseFiat])

  if (fiat == null) {
    return (
      <Typography component="span" color="text.secondary">
        --
      </Typography>
    )
  }

  return (
    <span suppressHydrationWarning style={style}>
      {precise ? (
        <>
          {whole}
          {decimals && (
            <Typography component="span" color="text.secondary" fontSize="inherit" fontWeight="inherit">
              {decimals}
            </Typography>
          )}
          {endCurrency}
        </>
      ) : (
        fiat
      )}
    </span>
  )
}

export default FiatValue
