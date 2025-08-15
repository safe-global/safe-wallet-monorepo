import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import usePositionsFiatTotal from '@/hooks/usePositionsFiatTotal'

const useFiatTotal = () => {
  const { balances } = useVisibleBalances()
  const positionsFiatTotal = usePositionsFiatTotal()

  if (!balances.fiatTotal) return

  return Number(balances.fiatTotal) + positionsFiatTotal
}

export default useFiatTotal
