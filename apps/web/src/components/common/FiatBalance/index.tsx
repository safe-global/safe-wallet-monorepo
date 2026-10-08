import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { FiatBalanceView } from '@views/components/common/FiatBalance/FiatBalanceView'

/** Renders a raw fiat amount formatted in the user's selected currency. Shared across features. */
const FiatBalance = ({ value }: { value: string | number | undefined }) => {
  const currency = useAppSelector(selectCurrency)

  return <FiatBalanceView value={value} currency={currency} />
}

export default FiatBalance
