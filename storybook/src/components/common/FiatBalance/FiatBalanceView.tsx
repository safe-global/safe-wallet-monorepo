import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { Typography } from '@/components/ui/typography'

export type FiatBalanceViewProps = {
  value: string | number | undefined
  currency: string
}

export const FiatBalanceView = ({ value, currency }: FiatBalanceViewProps) => {
  if (value === undefined) return null

  return <Typography variant="paragraph-small-medium">{formatCurrency(value, currency)}</Typography>
}
