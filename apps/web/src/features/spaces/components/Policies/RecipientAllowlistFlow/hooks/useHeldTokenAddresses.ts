import { useMemo } from 'react'
import useSpendingLimitTokenOptions from '../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import type { TokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'

type HeldTokenAddresses = {
  addresses: string[]
  /** Every group, so a token added from the popular list still resolves its symbol and icon. */
  options: TokenOption[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

const useHeldTokenAddresses = (): HeldTokenAddresses => {
  const { options, isLoading, isError, refetch } = useSpendingLimitTokenOptions()

  const addresses = useMemo(
    () => options.filter((option) => option.group === 'held').map((option) => option.address),
    [options],
  )

  return { addresses, options, isLoading, isError, refetch }
}

export default useHeldTokenAddresses
