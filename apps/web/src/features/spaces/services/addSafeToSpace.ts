import type { AppDispatch } from '@/store'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { normalizeSpaceId } from '@/utils/spaces'
import { SAFE_ACCOUNTS_LIMIT } from '../constants'

type AddSafeToSpaceArgs = {
  chainId: string
  safeAddress: string
  /** Active space id (string from auth state), or null if the user has none. */
  spaceId: string | null
  /** Whether the user is an active admin of the active space. When false the
   *  backend would reject the call with 403, so it is skipped. */
  isAdminOfActiveSpace: boolean
  /** Number of safes already in the active space, when known. */
  spaceSafeCount?: number
  dispatch: AppDispatch
}

export type AddSafeToSpaceResult =
  | { status: 'added' }
  | { status: 'skipped'; reason: 'no-space' | 'not-admin' | 'space-full' }
  /** `isLimitRejection` distinguishes "the space is full" (the safe itself is
   *  fine, the user has been informed) from a genuine write failure. */
  | { status: 'failed'; error: Error; isLimitRejection: boolean }

/**
 * Attaches an existing Safe address to the user's active space. Shared by the
 * counterfactual and the direct-deployment creation paths so both land the new
 * Safe in the same workspace.
 *
 * Never throws: every outcome is reported so the caller can decide whether it
 * is fatal. The counterfactual path rolls back and aborts on failure; the
 * deployment path cannot (the transaction is already broadcast) and only warns.
 */
export const addSafeToSpace = async ({
  chainId,
  safeAddress,
  spaceId,
  isAdminOfActiveSpace,
  spaceSafeCount,
  dispatch,
}: AddSafeToSpaceArgs): Promise<AddSafeToSpaceResult> => {
  // Guard against persisted/legacy lastUsedSpace values that are empty or
  // whitespace-only — pass any non-empty string through unchanged.
  const resolvedSpaceId = normalizeSpaceId(spaceId)
  if (resolvedSpaceId === null) {
    return { status: 'skipped', reason: 'no-space' }
  }

  if (!isAdminOfActiveSpace) {
    // Backend gates this endpoint on admin role and would 403. Inform the user —
    // the safe itself is unaffected.
    dispatch(
      showNotification({
        variant: 'info',
        groupKey: 'cf-safe-space-skipped',
        message: 'Safe added to your accounts — ask an admin to add it to the workspace',
      }),
    )
    return { status: 'skipped', reason: 'not-admin' }
  }

  if (spaceSafeCount !== undefined && spaceSafeCount >= SAFE_ACCOUNTS_LIMIT) {
    // Space is full — the backend would reject the add. Skip it so creation
    // still succeeds, but tell the user it wasn't added to the workspace.
    dispatch(
      showNotification({
        variant: 'info',
        groupKey: 'cf-safe-space-limit',
        message: `Safe created. This workspace is full (${SAFE_ACCOUNTS_LIMIT} Safes), so it wasn't added — switch to another workspace to add it there`,
      }),
    )
    return { status: 'skipped', reason: 'space-full' }
  }

  const spaceResult = await dispatch(
    spacesApi.endpoints.spaceSafesCreateV1.initiate({
      spaceId: resolvedSpaceId,
      createSpaceSafesDto: { safes: [{ chainId, address: safeAddress }] },
    }),
  )

  if ('error' in spaceResult) {
    const error = toSpaceError(spaceResult.error)

    // The Safe is already in this space (e.g. a leftover counterfactual record at
    // the same predicted address, a retry, or a co-admin adding it concurrently).
    // That is the end state we wanted, so report success — surfacing an error here
    // would also make the counterfactual caller roll back a perfectly good Safe.
    if (isDuplicateRejection(spaceResult.error)) {
      return { status: 'added' }
    }

    // Use case: another admin added Safes to the same workspace in the meantime.
    // The cached count was stale and the backend returned 400.
    if (isLimitRejection(spaceResult.error)) {
      dispatch(
        showNotification({
          variant: 'info',
          groupKey: 'cf-safe-space-limit',
          message: error.message,
        }),
      )
      return { status: 'failed', error, isLimitRejection: true }
    }

    return { status: 'failed', error, isLimitRejection: false }
  }

  return { status: 'added' }
}

type BackendError = { status?: number; data?: { message?: string } }

function toSpaceError(error: unknown): Error {
  return new Error((error as BackendError)?.data?.message || 'Failed to add Safe account to workspace')
}

/** True when the backend rejected the add because the Safe is already in the space.
 *  CGW answers 409, but a duplicate-key violation can also surface as a 5xx with the
 *  constraint text, so the message is matched independently of the status code. */
function isDuplicateRejection(error: unknown): boolean {
  const { status, data } = (error as BackendError) ?? {}
  return status === 409 || (typeof data?.message === 'string' && /already exists/i.test(data.message))
}

/** Matches the CGW limit message, e.g. "This space only allows a maximum of 40 safe accounts...".
 *  Other 400s (validation, malformed payload) must keep the rollback path. */
function isLimitRejection(error: unknown): boolean {
  const { status, data } = (error as BackendError) ?? {}
  return status === 400 && typeof data?.message === 'string' && /maximum of \d+/i.test(data.message)
}
