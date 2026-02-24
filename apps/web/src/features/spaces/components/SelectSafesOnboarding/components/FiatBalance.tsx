import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'

const FiatBalance = ({ value }: { value: string | number | undefined }) => {
  const currency = useAppSelector(selectCurrency)

  if (value === undefined) return null

  return <span className="text-sm font-medium text-muted-foreground">{formatCurrency(value, currency)}</span>
}

export default FiatBalance
