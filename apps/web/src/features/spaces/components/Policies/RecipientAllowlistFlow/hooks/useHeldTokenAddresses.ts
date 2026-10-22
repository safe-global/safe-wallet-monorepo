import { useMemo } from 'react'
import useSpendingLimitTokenOptions, {
  type TokenOptionsResult,
} from '../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'

type HeldTokenAddresses = TokenOptionsResult & {
  addresses: string[]
}

const useHeldTokenAddresses = (): HeldTokenAddresses => {
  const result = useSpendingLimitTokenOptions()
  const { options } = result

  const addresses = useMemo(
    () => options.filter((option) => option.group === 'held').map((option) => option.address),
    [options],
  )

  return { ...result, addresses }
}

export default useHeldTokenAddresses
