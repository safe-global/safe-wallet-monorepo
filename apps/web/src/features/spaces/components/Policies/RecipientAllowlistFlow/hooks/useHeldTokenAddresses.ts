import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { getPolicyEngineAddress } from '@/features/policy-guard/public/services/policyEngineDeployments'
import useSpendingLimitTokenOptions, {
  type TokenOptionsResult,
} from '../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import type { TokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'

export type HeldTokenAddresses = TokenOptionsResult & {
  addresses: string[]
}

/** `extraTokens` are listed whether or not the Safe holds them, such as the tokens of its spending limits. */
const useHeldTokenAddresses = (extraTokens?: readonly TokenOption[]): HeldTokenAddresses => {
  const result = useSpendingLimitTokenOptions(extraTokens)
  const { options: allOptions } = result
  const chainId = useSafeScope()?.chainId
  const hasNativePolicy = !chainId || !!getPolicyEngineAddress(chainId, 'NativeTransferPolicy')

  const options = useMemo(
    () => allOptions.filter((option) => hasNativePolicy || !sameAddress(option.address, ZERO_ADDRESS)),
    [allOptions, hasNativePolicy],
  )

  const addresses = useMemo(
    () => options.filter((option) => option.group === 'held').map((option) => option.address),
    [options],
  )

  return { ...result, options, addresses }
}

export default useHeldTokenAddresses
