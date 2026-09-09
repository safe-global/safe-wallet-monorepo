import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'

const FiatValue = ({
  value,
  maxLength,
  precise,
}: {
  value: string | number | null
  maxLength?: number
  precise?: boolean
}): ReactElement => {
  const currency = useAppSelector(selectCurrency)

  const fiat = useMemo(() => {
    return value != null ? formatCurrency(value, currency, maxLength) : null
  }, [value, currency, maxLength])

  const preciseFiat = useMemo(() => {
    return value != null ? formatCurrencyPrecise(value, currency) : null
  }, [value, currency])

  const [whole, decimals, endCurrency] = useMemo(() => {
    const match = (preciseFiat ?? '').match(/(.+)(\D\d+)(\D+)?$/)
    return match ? match.slice(1) : ['', preciseFiat, '', '']
  }, [preciseFiat])

  if (fiat == null) {
    return <span className="text-muted-foreground">--</span>
  }

  if (precise || !preciseFiat) {
    return (
      <span suppressHydrationWarning className="whitespace-nowrap">
        {precise ? (
          <>
            {whole}
            {decimals && <span className="text-muted-foreground">{decimals}</span>}
            {endCurrency}
          </>
        ) : (
          fiat
        )}
      </span>
    )
  }

  // `fiat` is abbreviated above ~$100k with a hover-only tooltip, so announce the full figure for screen
  // readers — but only when it differs, else the value duplicates for text selection and `getByText`.
  const content = (
    <span suppressHydrationWarning className="whitespace-nowrap">
      {fiat === preciseFiat ? (
        fiat
      ) : (
        <>
          <span aria-hidden>{fiat}</span>
          <span className="sr-only">{preciseFiat}</span>
        </>
      )}
    </span>
  )

  return (
    <Tooltip>
      <TooltipTrigger render={content} />
      <TooltipContent>{preciseFiat}</TooltipContent>
    </Tooltip>
  )
}

export default FiatValue
