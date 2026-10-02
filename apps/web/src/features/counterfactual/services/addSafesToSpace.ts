import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { AppDispatch } from '@/store'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'

export type SpaceAddOutcome =
  | { status: 'added' }
  | { status: 'stepUpPending' }
  | { status: 'seatLimit'; quota: number | null }
  | { status: 'legacyLimit'; message: string }
  | { status: 'failed'; error: Error }

type AddSafesToSpaceArgs = {
  spaceId: string
  safeAddress: string
  chainIds: string[]
  dispatch: AppDispatch
}

/** Adds one Safe address on several networks to a Workspace in a single request. */
export const addSafesToSpace = async ({
  spaceId,
  safeAddress,
  chainIds,
  dispatch,
}: AddSafesToSpaceArgs): Promise<SpaceAddOutcome> => {
  const result = await dispatch(
    spacesApi.endpoints.spaceSafesCreateV1.initiate({
      spaceId,
      createSpaceSafesDto: { safes: chainIds.map((chainId) => ({ chainId, address: safeAddress })) },
    }),
  )
  if (!('error' in result)) return { status: 'added' }

  const { error } = result
  if (isElevationRequiredError(error)) return { status: 'stepUpPending' }

  const quotaExceeded = getQuotaExceeded(error)
  if (quotaExceeded) return { status: 'seatLimit', quota: quotaExceeded.quota }

  if (isLimitRejection(error)) return { status: 'legacyLimit', message: toSpaceError(error).message }

  return { status: 'failed', error: toSpaceError(error) }
}

type BackendError = { status?: number; data?: { message?: string; code?: string; quota?: number } }

/** CGW rejects an add over the plan's seat quota with a typed 402; returns its quota, or undefined for any other error. */
function getQuotaExceeded(error: unknown): { quota: number | null } | undefined {
  const { status, data } = (error as BackendError) ?? {}
  if (status !== 402 || data?.code !== 'QUOTA_EXCEEDED') return undefined
  return { quota: typeof data.quota === 'number' ? data.quota : null }
}

/** Matches the legacy CGW limit message ("...a maximum of 40 safe accounts"); other 400s are failures. */
function isLimitRejection(error: unknown): boolean {
  const { status, data } = (error as BackendError) ?? {}
  return status === 400 && typeof data?.message === 'string' && /maximum of \d+/i.test(data.message)
}

function toSpaceError(error: FetchBaseQueryError | SerializedError | undefined): Error {
  return new Error((error && getRtkQueryErrorMessage(error)) || 'Failed to add Safe account to Workspace')
}
