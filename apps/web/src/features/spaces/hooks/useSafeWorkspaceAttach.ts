import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import useChainId from '@/hooks/useChainId'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useSafeWorkspacePicker } from '@/hooks/useSafeWorkspacePicker'
import type { SafeWorkspacePick } from '@/utils/spaces'
import { useAddUrlSpaceId, useIsSafeRoute, useIsWorkspaceSessionPending } from './useSafeWorkspaceCheck'

type SafePageWorkspacePick = {
  /** `chainId:address` of the Safe page; undefined on other pages, or until both are known. */
  safeKey: string | undefined
  /** Undefined while the data loads, or when the page needs no Workspace. */
  pick: SafeWorkspacePick | undefined
}

/** The Workspace pick for a Safe page whose URL has no `spaceId`, for a signed-in user. */
export const useSafePageWorkspacePick = (): SafePageWorkspacePick => {
  const { query } = useRouter()
  const isSafeRoute = useIsSafeRoute()
  const isSessionPending = useIsWorkspaceSessionPending()
  const chainId = useChainId()
  const safeAddress = useSafeAddressFromUrl()

  const safeKey = isSafeRoute && chainId && safeAddress ? `${chainId}:${safeAddress}` : undefined
  const isEnabled = safeKey !== undefined && query.spaceId === undefined && !isSessionPending
  const pickWorkspace = useSafeWorkspacePicker(isEnabled)

  return { safeKey, pick: isEnabled ? pickWorkspace(chainId, safeAddress) : undefined }
}

/**
 * On a Safe page without a `spaceId`, adds the Workspace of the Safe when the pick needs no user choice.
 * Acts once per visit to a Safe, so an id that the user or useSafeWorkspaceCheck removes stays removed.
 */
export const useSafeWorkspaceAttach = (): void => {
  const { safeKey, pick } = useSafePageWorkspacePick()
  const addUrlSpaceId = useAddUrlSpaceId()
  const attachedSafe = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Another Safe, or a page without one, ends the visit
    if (attachedSafe.current !== safeKey) attachedSafe.current = undefined
    if (attachedSafe.current !== undefined || pick?.kind !== 'one') return

    attachedSafe.current = safeKey
    addUrlSpaceId(pick.spaceId)
  }, [pick, safeKey, addUrlSpaceId])
}
