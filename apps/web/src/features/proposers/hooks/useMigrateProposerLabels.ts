import { useEffect } from 'react'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { PROPOSER_LABEL_PLACEHOLDER } from '@/features/proposers/constants'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useProposers from '@/hooks/useProposers'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useAppDispatch } from '@/store'

/**
 * Copies proposer names still held by the Transaction Service into the local address book so they
 * survive the move to local-only names. Signers only — an anonymous viewer must not end up
 * persisting someone else's name to disk.
 *
 * ponytail: no "already migrated" flag, so deleting a migrated contact brings it back on the next
 * load. Add the flag if that bites before Platform purges the stored labels.
 */
export const useMigrateProposerLabels = () => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const isSafeOwner = useIsSafeOwner()
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const proposers = useProposers()
  const { has } = useMergedAddressBooks(chainId)

  const isSigner = isSafeOwner || isNestedSafeOwner

  useEffect(() => {
    if (!isSigner) return

    for (const { delegate, label } of proposers.data?.results ?? []) {
      const name = sanitizeName(label ?? '')
      if (!name || name === PROPOSER_LABEL_PLACEHOLDER) continue
      if (has(delegate, chainId)) continue

      dispatch(upsertAddressBookEntries({ chainIds: [chainId], address: delegate, name }))
    }
  }, [chainId, dispatch, has, isSigner, proposers.data?.results])
}
