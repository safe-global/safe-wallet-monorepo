import { useState } from 'react'
import { useRouter } from 'next/router'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { stringify } from 'querystring'
import { useSpaceSafesCreateV1Mutation, type SpaceSafeDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { Errors, logError } from '@/services/exceptions'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { stepUpReturnUrlCleared, stepUpReturnUrlSet } from '@/features/oidc-auth/store'
import { withSpaceId } from '@/hooks/useUrlSpaceId'
import { getSeatLimitMessage } from '../../../utils/seatLimitError'

type AddOutcome = 'added' | 'stepUp' | 'failed'

interface UseAddSafeToSpaceResult {
  addToSpace: (spaceId: string) => Promise<boolean>
  loadingSpaceId: string | null
}

/** Adds the current Safe to a Workspace, then opens the Safe in that Workspace. */
export const useAddSafeToSpace = (): UseAddSafeToSpaceResult => {
  const router = useRouter()
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const [addSafeToSpace] = useSpaceSafesCreateV1Mutation()
  const [loadingSpaceId, setLoadingSpaceId] = useState<string | null>(null)

  const showError = (detail: string) =>
    dispatch(
      showNotification({
        message: `Failed to add Safe to Workspace. ${detail}`,
        variant: 'error',
        groupKey: 'add-safe-to-workspace-error',
      }),
    )

  const handleAddError = (error: FetchBaseQueryError | SerializedError) => {
    const seatLimit = getSeatLimitMessage(error)
    // Refreshes the meters of every Workspace, so the Workspace selector also sees the spent seats
    if (seatLimit) dispatch(entitlementsApi.util.invalidateTags(['entitlements']))
    showError(seatLimit ?? getRtkQueryErrorMessage(error))
  }

  const handleAdded = (spaceId: string, added: SpaceSafeDto, spaceQuery: typeof router.query) => {
    dispatch(
      showNotification({
        message: 'Successfully added Safe to Workspace.',
        variant: 'success',
        groupKey: 'add-safe-to-workspace-success',
      }),
    )
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_SAFE_LINKED, label: spaceId },
      { workspace_id: spaceId, safe_address: added.address, chain_id: added.chainId },
    )
    void router.replace({ pathname: router.pathname, query: spaceQuery }, undefined, { shallow: true })
  }

  const requestAdd = async (
    spaceId: string,
    toAdd: SpaceSafeDto,
    spaceQuery: typeof router.query,
  ): Promise<AddOutcome> => {
    const result = await addSafeToSpace({ spaceId, createSpaceSafesDto: { safes: [toAdd] } })
    if (isElevationRequiredError(result.error)) return 'stepUp'
    if (result.error) {
      handleAddError(result.error)
      return 'failed'
    }
    handleAdded(spaceId, toAdd, spaceQuery)
    return 'added'
  }

  const addToSpace = async (spaceId: string): Promise<boolean> => {
    if (!chain?.chainId || !safe.address.value) return false
    const toAdd = { chainId: chain.chainId, address: safe.address.value }
    const { spaceId: _replaced, ...query } = router.query
    const spaceQuery = withSpaceId(query, spaceId)
    // A step-up reloads the page, so it returns to this URL instead
    const stepUpReturnUrl = `${router.pathname}?${stringify(spaceQuery)}`

    setLoadingSpaceId(spaceId)
    dispatch(stepUpReturnUrlSet(stepUpReturnUrl))
    const outcome = await requestAdd(spaceId, toAdd, spaceQuery).catch((error: unknown): AddOutcome => {
      logError(Errors._651, error)
      showError(error instanceof Error ? error.message : '')
      return 'failed'
    })
    if (outcome !== 'stepUp') dispatch(stepUpReturnUrlCleared(stepUpReturnUrl))
    setLoadingSpaceId(null)
    return outcome === 'added'
  }

  return { addToSpace, loadingSpaceId }
}
