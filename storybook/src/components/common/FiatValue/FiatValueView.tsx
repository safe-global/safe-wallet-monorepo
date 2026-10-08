import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'

export type FiatValueViewProps = {
  value: string | number | null
  currency: string
  maxLength?: number
  precise?: boolean
}

export const FiatValueView = ({ value, currency, maxLength, precise }: FiatValueViewProps): ReactElement => {
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

  // The abbreviated `fiat` hides the precise figure from screen readers, so announce it separately when it differs.
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
