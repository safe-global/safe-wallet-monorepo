import { useMemo } from 'react'
import type { SuggestedContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSpaceAddressBookState } from '../../public/hooks/useGetSpaceAddressBook'
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
  // Without the private address book there is no Pending tab to act on a request from
  const hidesPending = useHasFeature(FEATURES.PRIVATE_ADDRESS_BOOK) ?? false
  const { configs } = useChains()

  const pendingRequests = hidesPending ? requests.items : undefined
  const suggestions = useMemo(
    () => toSuggestedContacts(signers, items, configs, pendingRequests),
    [signers, items, configs, pendingRequests],
  )

  const isRequestsError = hidesPending && requests.isError
  const reload = () => {
    if (isError) refetch()
    if (isRequestsError) requests.refetch()
  }

  return {
    suggestions,
    isLoading: isLoading || (hidesPending && requests.isLoading),
    isError: isError || isRequestsError,
    refetch: reload,
  }
}
