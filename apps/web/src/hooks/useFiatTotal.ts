import { useVisibleBalances } from '@/hooks/useVisibleBalances'

const useFiatTotal = () => {
  const { balances } = useVisibleBalances()

  if (!balances.fiatTotal) return

  return Number(balances.fiatTotal)
}

export default useFiatTotal
