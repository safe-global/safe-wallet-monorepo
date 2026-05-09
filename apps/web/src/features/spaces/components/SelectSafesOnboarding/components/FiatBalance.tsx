import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { Typography } from '@/components/ui/typography'

const FiatBalance = ({ value }: { value: string | number | undefined }) => {
  const currency = useAppSelector(selectCurrency)

  if (value === undefined) return null

  return (
    <Typography variant="paragraph-small-medium" color="muted">
      {formatCurrency(value, currency)}
    </Typography>
  )
}

export default FiatBalance
