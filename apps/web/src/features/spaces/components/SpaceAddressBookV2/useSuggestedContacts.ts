import { useMemo } from 'react'
import type { SuggestedContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { useSpaceAddressBookState } from '@/features/spaces'
import useChains from '@/hooks/useChains'
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
  const { configs } = useChains()

  const suggestions = useMemo(() => toSuggestedContacts(signers, items, configs), [signers, items, configs])

  return { suggestions, isLoading, isError, refetch }
}
