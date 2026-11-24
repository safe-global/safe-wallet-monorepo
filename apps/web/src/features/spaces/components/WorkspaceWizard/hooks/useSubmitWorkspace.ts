import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import {
  useSpacesCreateSetupV1Mutation,
  useSpacesUpdateSetupV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch } from '@/store'
import { clearWorkspaceDraft, type WorkspaceDraftFields } from '../../../public/store/workspaceDraftSlice'
import { isElevationRequiredError } from '@/features/oidc-auth/public/utils/elevation'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { navigateTo } from '@/utils/navigation'
import { getWizardReturnUrl } from '../../../hooks/billing/returnUrl'
import { toSetupRequest } from '../setupRequest'
import { useWorkspaceDraft } from './useWorkspaceDraft'

/** The CGW names the Workspace it created when only the checkout that followed failed. */
const createdSpaceIdOf = (error: FetchBaseQueryError | SerializedError): string | undefined => {
  if (!('data' in error) || typeof error.data !== 'object' || error.data === null) {
    return undefined
  }
  const spaceId = 'spaceId' in error.data ? error.data.spaceId : undefined
  return typeof spaceId === 'string' ? spaceId : undefined
}

const isNotFound = (error: FetchBaseQueryError | SerializedError): boolean => 'status' in error && error.status === 404

/** Creates the Workspace with its pending setup, or replaces that setup after a cancelled checkout, then leaves for Stripe. */
export const useSubmitWorkspace = (returnPathname: string) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { draft, update } = useWorkspaceDraft()
  const [createSetup] = useSpacesCreateSetupV1Mutation()
  const [updateSetup] = useSpacesUpdateSetupV1Mutation()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // A second call before the first returns would create a second Workspace.
  const inFlight = useRef(false)

  const submit = useCallback(
    async (lastChanges: Partial<WorkspaceDraftFields> = {}) => {
      if (inFlight.current) {
        return
      }
      inFlight.current = true
      setError(undefined)
      setIsSubmitting(true)
      update(lastChanges)

      const finalDraft = { ...draft, ...lastChanges }
      const existingId = finalDraft.createdSpaceId
      const createSpaceSetupDto = toSetupRequest(finalDraft, getWizardReturnUrl(returnPathname, existingId))
      const result = existingId
        ? await updateSetup({ id: existingId, createSpaceSetupDto })
        : await createSetup({ createSpaceSetupDto })

      inFlight.current = false

      if (result.error) {
        setIsSubmitting(false)
        if (isElevationRequiredError(result.error)) {
          return
        }
        if (existingId && isNotFound(result.error)) {
          update({ createdSpaceId: null })
          setError('This Workspace no longer exists. Submit again to create a new one.')
          return
        }
        const createdId = createdSpaceIdOf(result.error)
        if (createdId) {
          update({ createdSpaceId: createdId })
        }
        setError(getRtkQueryErrorMessage(result.error) || 'We couldn’t create the Workspace. Please try again.')
        return
      }

      const { spaceId, checkoutUrl } = result.data
      if (checkoutUrl) {
        // Saved before leaving: the return page finds the Workspace through the draft.
        update({ createdSpaceId: spaceId })
        navigateTo(checkoutUrl)
        return
      }

      dispatch(clearWorkspaceDraft())
      void router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
    },
    [draft, returnPathname, createSetup, updateSetup, update, dispatch, router],
  )

  return { submit, error, isSubmitting }
}
