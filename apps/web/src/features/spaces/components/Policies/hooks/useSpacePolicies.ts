import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { TxEvent } from '@/services/tx/txEvents'
import type {
  ActivePolicyDto,
  PendingPolicyDto,
  SpacePoliciesGetActivePoliciesV1ApiArg,
  SpacePoliciesGetPendingPoliciesV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useSpacePoliciesGetActivePoliciesV1Query,
  useSpacePoliciesGetPendingPoliciesV1Query,
} from '@/store/api/gateway/spacePolicies'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import { SPACE_REFRESH_OPTIONS } from '../../../hooks/refreshOptions'
import { mapActivePolicies } from '../utils/mapActivePolicies'
import { mapPendingPolicies } from '../utils/mapPendingPolicies'
import { usePolicyTokenResolver } from './usePolicyTokenResolver'
import { useActivatingPolicies } from './useActivatingPolicies'
import { useRefetchOnTxEvents } from './useRefetchOnTxEvents'
import type { Policy } from '../types'

/** The types the table renders. Asking for the rest would only return rows it cannot show. */
export const TABLE_POLICY_TYPES: SpacePoliciesGetActivePoliciesV1ApiArg['types'] = ['spending-limit', 'proposer']

/** Proposer grants take effect off chain at once, so only spending limits can be pending. */
export const PENDING_POLICY_TYPES: SpacePoliciesGetPendingPoliciesV1ApiArg['types'] = ['spending-limit']

const PENDING_REFETCH_EVENTS = [TxEvent.PROPOSED, TxEvent.SIGNATURE_PROPOSED, TxEvent.DELETED, TxEvent.SUCCESS]
const ACTIVE_REFETCH_EVENTS = [TxEvent.SUCCESS]

const NO_POLICIES: ActivePolicyDto[] = []
const NO_PENDING: PendingPolicyDto[] = []

export type SpacePoliciesResult = {
  policies: Policy[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** The Space's active and queued policies, ready for the table. It counts as loading until the active rows and their tokens are in. */
export const useSpacePolicies = (): SpacePoliciesResult => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const skip = !isUserSignedIn || !spaceId

  const active = useSpacePoliciesGetActivePoliciesV1Query(
    { spaceId: spaceId ?? '', types: TABLE_POLICY_TYPES },
    { skip, ...SPACE_REFRESH_OPTIONS },
  )
  const pending = useSpacePoliciesGetPendingPoliciesV1Query(
    { spaceId: spaceId ?? '', types: PENDING_POLICY_TYPES },
    { skip, ...SPACE_REFRESH_OPTIONS },
  )

  useRefetchOnTxEvents(PENDING_REFETCH_EVENTS, pending.refetch, !skip)
  useRefetchOnTxEvents(ACTIVE_REFETCH_EVENTS, active.refetch, !skip)

  const dtos = active.currentData ?? NO_POLICIES
  // Queued changes are extra information: without them the table still shows what is enforced.
  const pendingDtos = pending.currentData ?? NO_PENDING

  // Separate lookups, so tokens only a queued change uses don't blank the active rows while they load.
  const activeTokens = usePolicyTokenResolver(dtos)
  const pendingTokens = usePolicyTokenResolver(NO_POLICIES, pendingDtos)

  const activeRows = useMemo(
    () => mapActivePolicies(dtos, activeTokens.resolveToken),
    [dtos, activeTokens.resolveToken],
  )
  const pendingRows = useMemo(
    () => (pendingTokens.isLoading ? [] : mapPendingPolicies(pendingDtos, activeRows, pendingTokens.resolveToken)),
    [pendingDtos, activeRows, pendingTokens.isLoading, pendingTokens.resolveToken],
  )
  const activatingRows = useActivatingPolicies(pendingRows, activeRows, {
    refetchActive: active.refetch,
    resetKey: spaceId,
    enabled: !skip,
  })

  const policies = useMemo(
    () => [...activeRows, ...pendingRows, ...activatingRows],
    [activeRows, pendingRows, activatingRows],
  )

  // RTK's isLoading stays false on a refetch after an error, so it would hide a retry of the active rows.
  const isLoadingActive = active.isFetching && !active.currentData

  const refetch = () => {
    active.refetch()
    pending.refetch()
  }

  return {
    policies,
    isLoading: isLoadingActive || activeTokens.isLoading,
    isError: active.isError,
    refetch,
  }
}
