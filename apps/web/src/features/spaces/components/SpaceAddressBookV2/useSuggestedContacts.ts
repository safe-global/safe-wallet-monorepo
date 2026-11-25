import { useMemo } from 'react'
import type { SuggestedContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSpaceAddressBookState } from '../../public/hooks/useGetSpaceAddressBook'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import useChains, { useHasFeature } from '@/hooks/useChains'
import { useAddressBookRequestsState } from '../../hooks/useGetAddressBookRequests'
import { useWorkspaceSigners } from '../../hooks/useWorkspaceSigners'
import { toSuggestedContacts } from './suggestions'

export const useSuggestedContacts = (): {
  suggestions: SuggestedContact[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
} => {
  const { signers, isLoading, isError, refetch } = useWorkspaceSigners()
  const { items } = useSpaceAddressBookState()
  const requests = useAddressBookRequestsState()
  const allLocalBooks = useAllAddressBooks()
  // Without the private address book there are no Pending and Local tabs to hide suggestions behind
  const hasPrivateBook = useHasFeature(FEATURES.PRIVATE_ADDRESS_BOOK) ?? false
  const { configs } = useChains()

  const pendingRequests = hasPrivateBook ? requests.items : undefined
  const localBooks = hasPrivateBook ? allLocalBooks : undefined
  const suggestions = useMemo(
    () => toSuggestedContacts(signers, items, configs, { pendingRequests, localBooks }),
    [signers, items, configs, pendingRequests, localBooks],
  )

  const isRequestsError = hasPrivateBook && requests.isError
  const reload = () => {
    if (isError) refetch()
    if (isRequestsError) requests.refetch()
  }

  return {
    suggestions,
    isLoading: isLoading || (hasPrivateBook && requests.isLoading),
    isError: isError || isRequestsError,
    refetch: reload,
  }
}
