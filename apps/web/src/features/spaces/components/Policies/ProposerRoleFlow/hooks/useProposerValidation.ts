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
  PROPOSER_SAFE_LOADING_MESSAGE,
} from '../constants'

export const addressIsNotExistingProposer =
  (proposers: string[], message: string) =>
  (address: string): string | undefined =>
    proposers.some((proposer) => sameAddress(proposer, address)) ? message : undefined

/**
 * The proposer address rules, resolved against the Safe the flow is scoped to. Same rules as the
 * per-Safe settings flow plus the existing-proposer check; the Safe-dependent ones wait for a pick.
 * Until the picked Safe, its proposers and its provider are loaded the field stays invalid: with
 * empty owner lists the checks would pass, and without the scoped provider the contract check would
 * read (and cache under this chain) code from the URL chain.
 */
export const useProposerValidation = (): Validate<string> => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const chainId = useChainId()
  const provider = useWeb3ReadOnly()
  const { data: delegates, isError: delegatesError } = useProposers()

  const owners = useMemo(() => safe.owners.map((owner) => owner.value), [safe.owners])
  const existingProposers = useMemo(() => delegates?.results.map((delegate) => delegate.delegate) ?? [], [delegates])
  const delegatesLoadedOrFailed = delegates !== undefined || delegatesError
  const isReady = safeLoaded && delegatesLoadedOrFailed && provider !== undefined

  return useCallback<Validate<string>>(
    async (value) => {
      const reserved = addressIsNotReserved(PROPOSER_RESERVED_ERROR)(value)
      if (reserved || !safeAddress) return reserved
      if (!isReady) return PROPOSER_SAFE_LOADING_MESSAGE

      return (
        addressIsNotCurrentSafe(safeAddress, PROPOSER_IS_SAFE_ERROR)(value) ??
        addressIsNotOwner(owners, PROPOSER_IS_OWNER_ERROR)(value) ??
        addressIsNotExistingProposer(existingProposers, PROPOSER_EXISTS_ERROR)(value) ??
        (await addressIsNotSmartContract(chainId, SMART_CONTRACT_PROPOSER_ERROR, provider)(value))
      )
    },
    [safeAddress, isReady, owners, existingProposers, chainId, provider],
  )
}
