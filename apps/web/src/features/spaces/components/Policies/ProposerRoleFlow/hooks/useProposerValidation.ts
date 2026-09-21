import { useCallback, useMemo } from 'react'
import type { Validate } from 'react-hook-form'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { addressIsNotCurrentSafe, addressIsNotOwner, addressIsNotReserved } from '@safe-global/utils/utils/validation'
import { SMART_CONTRACT_PROPOSER_ERROR } from '@/features/proposers/constants'
import { addressIsNotSmartContract } from '@/features/proposers/utils/utils'
import useChainId from '@/hooks/useChainId'
import useProposers from '@/hooks/useProposers'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import {
  PROPOSER_EXISTS_ERROR,
  PROPOSER_IS_OWNER_ERROR,
  PROPOSER_IS_SAFE_ERROR,
  PROPOSER_RESERVED_ERROR,
} from '../constants'

export const addressIsNotExistingProposer =
  (proposers: string[], message: string) =>
  (address: string): string | undefined =>
    proposers.some((proposer) => sameAddress(proposer, address)) ? message : undefined

/**
 * The proposer address rules, resolved against the Safe the flow is scoped to. Same rules as the
 * per-Safe settings flow plus the existing-proposer check; the Safe-dependent ones wait for a pick.
 */
export const useProposerValidation = (): Validate<string> => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = useChainId()
  // The picked Safe's chain inside the flow; without it the check would read code from the URL chain.
  const provider = useWeb3ReadOnly()
  const { data: delegates } = useProposers()

  const owners = useMemo(() => safe.owners.map((owner) => owner.value), [safe.owners])
  const existingProposers = useMemo(() => delegates?.results.map((delegate) => delegate.delegate) ?? [], [delegates])

  return useCallback<Validate<string>>(
    async (value) => {
      const reserved = addressIsNotReserved(PROPOSER_RESERVED_ERROR)(value)
      if (reserved || !safeAddress) return reserved

      return (
        addressIsNotCurrentSafe(safeAddress, PROPOSER_IS_SAFE_ERROR)(value) ??
        addressIsNotOwner(owners, PROPOSER_IS_OWNER_ERROR)(value) ??
        addressIsNotExistingProposer(existingProposers, PROPOSER_EXISTS_ERROR)(value) ??
        (await addressIsNotSmartContract(chainId, SMART_CONTRACT_PROPOSER_ERROR, provider)(value))
      )
    },
    [safeAddress, owners, existingProposers, chainId, provider],
  )
}
