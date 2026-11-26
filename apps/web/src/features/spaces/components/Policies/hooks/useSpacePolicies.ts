import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxEvent } from '@/services/tx/txEvents'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type {
  ActivePolicyDto,
  PendingDelayedGuardPoliciesDto,
  PendingGuardInstallationDto,
  PendingImmediateGuardPoliciesDto,
  PendingPolicyDto,
  SpacePoliciesGetActivePoliciesV1ApiArg,
  SpacePoliciesGetPendingPoliciesV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  useSpacePoliciesGetActivePoliciesV1Query,
  useSpacePoliciesGetPendingPoliciesV1Query,
} from '@/store/api/gateway/spacePolicies'
import useChains from '@/hooks/useChains'
import { isAllowlistEnabled } from '@/features/policy-guard/public/services/allowlistAvailability'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useCurrentSpaceId } from '../../../public/hooks/useCurrentSpaceId'
import { SPACE_REFRESH_OPTIONS } from '../../../hooks/refreshOptions'
import { mapActivePolicies, type NativeTokenResolver } from '../utils/mapActivePolicies'
import { getPendingTxId, mapPendingPolicies } from '../utils/mapPendingPolicies'
import { toPolicyToken } from '../utils/toPolicyToken'
import { mergeDelayedGuardRequests, type GuardRemovalCleanup } from '../utils/mapDelayedGuardRequests'
import { mapImmediateGuardPolicies } from '../utils/mapImmediateGuardPolicies'
import { mergeGuardRemovals } from '../utils/mapGuardRemovals'
import { applyTxOutcome } from '../utils/allowlistStatus'
import type { ApplyAllowlistFlowData } from '../ApplyAllowlistFlow/types'
import { useActivatingPolicies, type QueuedPolicy } from './useActivatingPolicies'
import { useQueuedTxSignals, type QueuedTxSignals } from './useQueuedTxSignals'
import { useRefetchOnTxEvents } from './useRefetchOnTxEvents'
import { usePollAfterTx } from './usePollAfterTx'
import {
  isAllowlistPolicy,
  isPendingPolicy,
  type Policy,
  type QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'

/** The types the table renders, plus `allow`, whose rule on `setGuard` marks an allowlist waiting for its guard to come off. */
export const TABLE_POLICY_TYPES: SpacePoliciesGetActivePoliciesV1ApiArg['types'] = [
  'spending-limit',
  'proposer',
  'erc20-transfer',
  'native-transfer',
  'allow',
]

/**
 * Proposer grants take effect off chain at once, so only spending limits and allowlists can be pending. `allow` keeps a
 * removal's clean-up listed once its rules are deleted, so the guard removal applies it.
 */
export const PENDING_POLICY_TYPES: SpacePoliciesGetPendingPoliciesV1ApiArg['types'] = [
  'spending-limit',
  'erc20-transfer',
  'native-transfer',
  'allow',
]

const PENDING_REFETCH_EVENTS = [
  TxEvent.PROPOSED,
  TxEvent.SIGNATURE_PROPOSED,
  TxEvent.ONCHAIN_SIGNATURE_SUCCESS,
  TxEvent.DELETED,
  TxEvent.PROCESSED,
  TxEvent.SUCCESS,
]
const ACTIVE_REFETCH_EVENTS = [TxEvent.SUCCESS]
const POLL_EVENTS = [TxEvent.PROCESSED, TxEvent.SUCCESS]

const NO_POLICIES: ActivePolicyDto[] = []
const NO_PENDING: PendingPolicyDto[] = []
const NO_DELAYED: PendingDelayedGuardPoliciesDto[] = []
const NO_IMMEDIATE: PendingImmediateGuardPoliciesDto[] = []
const NO_GUARD_INSTALLATIONS: PendingGuardInstallationDto[] = []

const isQueuedAllowlist = (policy: Policy): policy is QueuedAllowlistPolicy =>
  isAllowlistPolicy(policy) && policy.status === 'pending'

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

/** A queued row as CGW's details of its transaction tell it, which the table and the panel then both read. */
const withCachedTx = (policy: Policy, { failed, confirmations }: QueuedTxSignals): Policy => {
  if (!isPendingPolicy(policy) || policy.status !== 'pending') return policy

  const txId = getPendingTxId(policy)
  const signed = confirmations.get(txId)
  const counted =
    signed === undefined || signed === policy.confirmationsSubmitted
      ? policy
      : { ...policy, confirmationsSubmitted: signed }

  return isAllowlistPolicy(counted) && failed.has(txId) ? applyTxOutcome(counted, 'failed') : counted
}

/** The active rows the table shows: an allowlist only on a chain that supports it. */
export const toActiveRows = (dtos: ActivePolicyDto[], chains: Chain[]): Policy[] => {
  const allowlistChainIds = new Set(chains.filter(isAllowlistEnabled).map((chain) => chain.chainId))

  return mapActivePolicies(dtos, toNativeTokenResolver(chains)).filter(
    (policy) => !isAllowlistPolicy(policy) || allowlistChainIds.has(policy.safe.chainId),
  )
}

export type SpacePoliciesResult = {
  policies: Policy[]
  /** What the apply flow replays for an allowlist row whose guard delay has passed, keyed by row id. */
  allowlistApplyRequests: ReadonlyMap<string, ApplyAllowlistFlowData>
  /** A removal's second root, which the guard removal applies with it, keyed by the allowlist's row id. */
  guardRemovalCleanups: ReadonlyMap<string, GuardRemovalCleanup>
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** The Space's active and queued policies, ready for the table. It counts as loading until the active rows are in. */
export const useSpacePolicies = (): SpacePoliciesResult => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const skip = !isUserSignedIn || !spaceId
  const { configs: chains } = useChains()

  const isPollingAfterTx = usePollAfterTx(POLL_EVENTS, !skip)
  // An executed change is polled for until CGW serves it, which useActivatingPolicies bounds.
  const [isAwaitingServe, setIsAwaitingServe] = useState(false)
  const active = useSpacePoliciesGetActivePoliciesV1Query(
    { spaceId: spaceId ?? '', types: TABLE_POLICY_TYPES },
    {
      skip,
      ...SPACE_REFRESH_OPTIONS,
      pollingInterval: isAwaitingServe || isPollingAfterTx ? POLLING_INTERVAL : 0,
      skipPollingIfUnfocused: true,
    },
  )
  // A fully signed change can be executed elsewhere, and CGW may still list it just after it is mined.
  const [hasExecutable, setHasExecutable] = useState(false)
  const pending = useSpacePoliciesGetPendingPoliciesV1Query(
    { spaceId: spaceId ?? '', types: PENDING_POLICY_TYPES, includeGuardInstallation: true },
    {
      skip,
      ...SPACE_REFRESH_OPTIONS,
      pollingInterval: hasExecutable || isAwaitingServe || isPollingAfterTx ? POLLING_INTERVAL : 0,
      skipPollingIfUnfocused: true,
    },
  )

  useRefetchOnTxEvents(PENDING_REFETCH_EVENTS, pending.refetch, !skip)
  useRefetchOnTxEvents(ACTIVE_REFETCH_EVENTS, active.refetch, !skip)

  const dtos = active.currentData ?? NO_POLICIES
  // Queued changes are extra information: without them the table still shows what is enforced.
  const pendingDtos = useMemo(
    () =>
      pending.currentData?.filter(
        (dto): dto is PendingPolicyDto & { kind: 'queued-transaction' } => dto.kind === 'queued-transaction',
      ) ?? NO_PENDING,
    [pending.currentData],
  )

  const delayedDtos = useMemo(
    () =>
      pending.currentData?.filter(
        (dto): dto is PendingDelayedGuardPoliciesDto & { kind: 'delayed-guard-policies' } =>
          dto.kind === 'delayed-guard-policies',
      ) ?? NO_DELAYED,
    [pending.currentData],
  )

  const immediateDtos = useMemo(
    () =>
      pending.currentData?.filter(
        (dto): dto is PendingImmediateGuardPoliciesDto & { kind: 'immediate-guard-policies' } =>
          dto.kind === 'immediate-guard-policies',
      ) ?? NO_IMMEDIATE,
    [pending.currentData],
  )

  const guardInstallationDtos = useMemo(
    () =>
      pending.currentData?.filter(
        (dto): dto is PendingGuardInstallationDto & { kind: 'guard-installation' } => dto.kind === 'guard-installation',
      ) ?? NO_GUARD_INSTALLATIONS,
    [pending.currentData],
  )

  useEffect(() => {
    setHasExecutable(
      pendingDtos.some((dto) => dto.confirmations >= dto.confirmationsRequired) ||
        immediateDtos.some((dto) => dto.status === 'ready') ||
        delayedDtos.some((dto) => dto.status === 'application-ready') ||
        guardInstallationDtos.some((dto) => dto.status === 'ready'),
    )
  }, [pendingDtos, immediateDtos, delayedDtos, guardInstallationDtos])

  const activeRows = useMemo(() => toActiveRows(dtos, chains), [dtos, chains])
  const resolveGuardToken = useMemo(() => {
    const resolveNative = toNativeTokenResolver(chains)
    const erc20Tokens = new Map(
      dtos.flatMap((dto) =>
        dto.type === 'erc20-transfer' && 'tokenAddress' in dto.data
          ? [
              [
                `${dto.safe.chainId}:${dto.data.tokenAddress.toLowerCase()}`,
                toPolicyToken(dto.data.tokenAddress, dto.data.tokenMetadata),
              ] as const,
            ]
          : [],
      ),
    )
    // A token the active policies never named has no metadata, so its address stands in for the symbol.
    return (chainId: string, address: string) =>
      (address === ZERO_ADDRESS ? resolveNative(chainId) : erc20Tokens.get(`${chainId}:${address.toLowerCase()}`)) ?? {
        address,
        symbol: shortenAddress(address),
        decimals: 18,
        logoUri: null,
      }
  }, [chains, dtos])
  const delayed = useMemo(
    () => mergeDelayedGuardRequests(delayedDtos, activeRows, resolveGuardToken),
    [delayedDtos, activeRows, resolveGuardToken],
  )
  const allowlistRows = useMemo(
    () => mergeGuardRemovals(guardInstallationDtos, delayed.policies),
    [guardInstallationDtos, delayed.policies],
  )
  const setupRows = useMemo(
    () =>
      immediateDtos.flatMap((dto) => {
        const row = mapImmediateGuardPolicies(dto, (address) => resolveGuardToken(dto.safe.chainId, address))
        return row ? [row] : []
      }),
    [immediateDtos, resolveGuardToken],
  )
  const pendingRows = useMemo(() => mapPendingPolicies(pendingDtos, activeRows), [pendingDtos, activeRows])
  const listed = useMemo(
    () => [...allowlistRows, ...setupRows, ...pendingRows],
    [allowlistRows, setupRows, pendingRows],
  )
  const queuedRows = useMemo<QueuedPolicy[]>(
    () => [...pendingRows, ...listed.filter(isQueuedAllowlist)],
    [pendingRows, listed],
  )
  const { refetch: refetchActive } = active
  const { refetch: refetchPending } = pending
  // An allowlist change shows in the pending requests as well as in the active rules.
  const refetchHeld = useCallback(() => {
    refetchActive()
    refetchPending()
  }, [refetchActive, refetchPending])
  const signals = useQueuedTxSignals(queuedRows, spaceId)
  const activatingRows = useActivatingPolicies(queuedRows, listed, {
    refetch: refetchHeld,
    resetKey: spaceId,
    enabled: !skip,
    signals,
  })

  useEffect(() => {
    setIsAwaitingServe(activatingRows.length > 0)
  }, [activatingRows])

  // An allowlist keeps one row: while its executed transaction is processed, the held row stands in for it.
  const policies = useMemo(() => {
    const held = new Map<string, Policy>(activatingRows.map((policy) => [policy.id, policy]))
    const listedIds = new Set(listed.map((policy) => policy.id))
    return [
      ...listed.map((policy) => held.get(policy.id) ?? withCachedTx(policy, signals)),
      ...activatingRows.filter((policy) => !listedIds.has(policy.id)),
    ]
  }, [listed, activatingRows, signals])

  // RTK's isLoading stays false on a refetch after an error, so it would hide a retry of the active rows.
  const isLoadingActive = active.isFetching && !active.currentData

  const refetch = () => {
    active.refetch()
    pending.refetch()
  }

  return {
    policies,
    allowlistApplyRequests: delayed.applyRequests,
    guardRemovalCleanups: delayed.guardRemovalCleanups,
    isLoading: isLoadingActive,
    isError: active.isError,
    refetch,
  }
}
