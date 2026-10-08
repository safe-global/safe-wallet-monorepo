import type { ReactElement } from 'react'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { FiatValueView } from '@views/components/common/FiatValue/FiatValueView'

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

  return <FiatValueView value={value} currency={currency} maxLength={maxLength} precise={precise} />
}

export default FiatValue
