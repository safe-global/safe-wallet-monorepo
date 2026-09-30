import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useChain } from '@/hooks/useChains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { isSmartContractWallet } from '@/utils/wallets'
import type { Proposer } from '../../types'

/** The parent Safe that granted the role: the first delegator with code. An unreadable delegator counts as an EOA. */
export const useNestedSafeGrantor = (chainId: string, proposer: Proposer): string | undefined => {
  const chain = useChain(chainId)
  const provider = useMemo(() => (chain ? createWeb3ReadOnly(chain) : undefined), [chain])

  const [grantor] = useAsync(async () => {
    if (!provider) return

    for (const { delegator } of proposer.delegatedBy) {
      const isContract = await isSmartContractWallet(chainId, delegator, provider).catch(() => false)
      if (isContract) return delegator
    }
  }, [chainId, proposer, provider])

  return grantor
}
