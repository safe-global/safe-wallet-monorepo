import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxEvent } from '@/services/tx/txEvents'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type {
  ActivePolicyDto,
  PendingPolicyDto,
  SpacePoliciesGetActivePoliciesV1ApiArg,
  SpacePoliciesGetPendingPoliciesV1ApiArg,
  SpacePoliciesGetPendingPoliciesV1ApiResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useSpacePoliciesGetActivePoliciesV1Query,
  useSpacePoliciesGetPendingPoliciesV1Query,
} from '@/store/api/gateway/spacePolicies'
import useChains from '@/hooks/useChains'
import { useIsAllowlistActiveInSpace } from '@/features/policy-guard'
import { isAllowlistEnabled } from '@/features/policy-guard/services'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import { SPACE_REFRESH_OPTIONS } from '../../../hooks/refreshOptions'
import { mapActivePolicies, type Erc20TokenResolver, type NativeTokenResolver } from '../utils/mapActivePolicies'
import { mapPendingPolicies } from '../utils/mapPendingPolicies'
import { getNextGuardBoundary, mapPendingGuardChanges } from '../utils/mapPendingGuardChanges'
import { useActivatingPolicies } from './useActivatingPolicies'
import { useAllowlistTokenResolver } from './useAllowlistTokenResolver'
import { useRefetchOnTxEvents } from './useRefetchOnTxEvents'
import { isAllowlistPolicy, type Policy } from '@safe-global/views/features/spaces/components/Policies/types'

/** The types the table renders. Asking for the rest would only return rows it cannot show. */
export const TABLE_POLICY_TYPES: SpacePoliciesGetActivePoliciesV1ApiArg['types'] = [
  'spending-limit',
  'proposer',
  'erc20-transfer',
  'native-transfer',
  'multisend',
  'allow',
]

export const ALLOWLIST_POLICY_TYPES: SpacePoliciesGetActivePoliciesV1ApiArg['types'] = [
  'erc20-transfer',
  'native-transfer',
]

/**
 * Proposer grants take effect off chain at once, so only spending limits and guard policies can be pending.
 * Every guard type is asked for, allowlists too: a pending change is on chain and owners must be able to finish it.
 */
export const PENDING_POLICY_TYPES: SpacePoliciesGetPendingPoliciesV1ApiArg['types'] = [
  'spending-limit',
  'multisend',
  'allow',
  'deny',
  'cosigner',
  ...ALLOWLIST_POLICY_TYPES,
]

type PendingDto = SpacePoliciesGetPendingPoliciesV1ApiResponse[number]

const isQueuedSpendingLimit = (dto: PendingDto): dto is PendingDto & PendingPolicyDto =>
  dto.kind === 'queued-transaction'

/** Whether a fully signed transaction is in the queue, which can be executed from anywhere. */
const isExecutable = (dto: PendingDto): boolean => {
  const tx = dto.kind === 'queued-transaction' ? dto : dto.transaction
  return !!tx && tx.confirmations >= tx.confirmationsRequired
}

// setTimeout overflows past about 24.8 days.
const MAX_TIMEOUT_MS = 2 ** 31 - 1

const PENDING_REFETCH_EVENTS = [
  TxEvent.PROPOSED,
  TxEvent.SIGNATURE_PROPOSED,
  TxEvent.ONCHAIN_SIGNATURE_SUCCESS,
  TxEvent.DELETED,
  // SUCCESS comes from the Safe-level history slice, which a Space route does not load.
  TxEvent.PROCESSED,
  TxEvent.SUCCESS,
]
const ACTIVE_REFETCH_EVENTS = [TxEvent.SUCCESS]

const NO_POLICIES: ActivePolicyDto[] = []
const NO_PENDING: PendingDto[] = []

/** CGW sends no metadata with a native-transfer policy, so the coin comes from the chain config. */
const toNativeTokenResolver = (chains: Chain[]): NativeTokenResolver => {
  const byChainId = new Map(chains.map((chain) => [chain.chainId, chain.nativeCurrency]))

  return (chainId) => {
    const native = byChainId.get(chainId)
    return native
      ? { address: ZERO_ADDRESS, symbol: native.symbol, decimals: native.decimals, logoUri: native.logoUri }
      : undefined
  }
}

const toActiveRows = (dtos: ActivePolicyDto[], chains: Chain[], resolveErc20Token: Erc20TokenResolver): Policy[] => {
  const allowlistChainIds = new Set(chains.filter(isAllowlistEnabled).map((chain) => chain.chainId))

  return mapActivePolicies(dtos, toNativeTokenResolver(chains), resolveErc20Token).filter(
    (policy) => !isAllowlistPolicy(policy) || allowlistChainIds.has(policy.safe.chainId),
  )
}

export type SpacePoliciesResult = {
  policies: Policy[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** The Space's active and queued policies, ready for the table. It counts as loading until the active rows are in. */
export const useSpacePolicies = (): SpacePoliciesResult => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const skip = !isUserSignedIn || !spaceId
  const isAllowlistActive = useIsAllowlistActiveInSpace(spaceId ?? undefined)
  // Waiting for the gate keeps the request from running once without allowlists and again with them.
  const isWaitingForGate = !skip && isAllowlistActive === undefined
  const { configs: chains } = useChains()
  const types = isAllowlistActive ? [...TABLE_POLICY_TYPES, ...ALLOWLIST_POLICY_TYPES] : TABLE_POLICY_TYPES

  const active = useSpacePoliciesGetActivePoliciesV1Query(
    { spaceId: spaceId ?? '', types },
    { skip: skip || isWaitingForGate, ...SPACE_REFRESH_OPTIONS },
  )
  // A fully signed change can be executed elsewhere, and CGW may still list it just after it is mined.
  const [hasExecutable, setHasExecutable] = useState(false)
  const pending = useSpacePoliciesGetPendingPoliciesV1Query(
    { spaceId: spaceId ?? '', types: PENDING_POLICY_TYPES },
    {
      skip,
      ...SPACE_REFRESH_OPTIONS,
      pollingInterval: hasExecutable ? POLLING_INTERVAL : 0,
      skipPollingIfUnfocused: true,
    },
  )

  useRefetchOnTxEvents(PENDING_REFETCH_EVENTS, pending.refetch, !skip)
  useRefetchOnTxEvents(ACTIVE_REFETCH_EVENTS, active.refetch, !skip)

  const dtos = active.currentData ?? NO_POLICIES
  // Queued changes are extra information: without them the table still shows what is enforced.
  const pendingDtos = pending.currentData ?? NO_PENDING

  useEffect(() => {
    setHasExecutable(pendingDtos.some(isExecutable))
  }, [pendingDtos])

  // A delayed guard change moves on by the clock, so the rows are re-read when its delay ends or its window closes.
  const nextGuardBoundary = useMemo(
    () => getNextGuardBoundary(pendingDtos, Math.floor(Date.now() / 1000)),
    [pendingDtos],
  )
  const refetchPending = pending.refetch
  useEffect(() => {
    if (skip || nextGuardBoundary === undefined) return

    const delayMs = nextGuardBoundary * 1000 - Date.now() + 1000
    if (delayMs > MAX_TIMEOUT_MS) return

    const timeout = setTimeout(refetchPending, Math.max(delayMs, 0))
    return () => clearTimeout(timeout)
  }, [skip, nextGuardBoundary, refetchPending])

  const resolveErc20Token = useAllowlistTokenResolver(dtos)
  const activeRows = useMemo(() => toActiveRows(dtos, chains, resolveErc20Token), [dtos, chains, resolveErc20Token])
  const pendingRows = useMemo(
    () => mapPendingPolicies(pendingDtos.filter(isQueuedSpendingLimit), activeRows),
    [pendingDtos, activeRows],
  )
  const guardChangeRows = useMemo(() => mapPendingGuardChanges(pendingDtos), [pendingDtos])
  const activatingRows = useActivatingPolicies(pendingRows, activeRows, {
    refetchActive: active.refetch,
    resetKey: spaceId,
    enabled: !skip,
  })

  const policies = useMemo(
    () => [...activeRows, ...pendingRows, ...activatingRows, ...guardChangeRows],
    [activeRows, pendingRows, activatingRows, guardChangeRows],
  )

  // RTK's isLoading stays false on a refetch after an error, so it would hide a retry of the active rows.
  const isLoadingActive = isWaitingForGate || (active.isFetching && !active.currentData)

  const refetch = () => {
    active.refetch()
    pending.refetch()
  }

  return {
    policies,
    isLoading: isLoadingActive,
    isError: active.isError,
    refetch,
  }
}
