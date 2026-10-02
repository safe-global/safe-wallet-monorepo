import type { JsonRpcProvider } from 'ethers'
import type { AppDispatch } from '@/store'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { showNotification } from '@/store/notificationsSlice'
import { isSpaceAtSafeLimit, type SafeLimit } from '@/utils/spaces'
import { saveCounterfactualSafe, type SaveResult } from './saveCounterfactualSafe'
import { addSafesToSpace } from './addSafesToSpace'
import { removeUndeployedSafe } from '../store/undeployedSafesSlice'

type CreateCounterfactualSafeArgs = {
  /** Each network with an optional read-only provider for the signed-out deployment check. */
  networks: Array<{ chainId: string; provider?: JsonRpcProvider }>
  safeAddress: string
  props: ReplayedSafeProps
  name: string
  payMethod: PayMethod
  /** The Workspace of the URL (useUrlSpaceId), or null outside a Workspace. */
  spaceId: string | null
  isUserAuthenticated: boolean
  isAdminOfActiveSpace: boolean
  spaceSafeCount?: number
  /** `null` = unlimited, `undefined` = unknown, so the backend decides. */
  spaceSafeLimit: SafeLimit
  /** The Safe address is already in the Workspace on another network, so this add takes no new seat. */
  holdsSeatInSpace?: boolean
  dispatch: AppDispatch
}

export type ChainCreationResult = { chainId: string } & SaveResult

export type CreateCounterfactualSafeResult = {
  chains: ChainCreationResult[]
  /** The step-up replays the Workspace request, so the caller keeps the Safe and shows nothing. */
  isStepUpPending: boolean
}

/** Saves a counterfactual Safe on every network, then adds the new ones to the Workspace in one request. */
export const createCounterfactualSafe = async ({
  networks,
  safeAddress,
  props,
  name,
  payMethod,
  spaceId,
  isUserAuthenticated,
  isAdminOfActiveSpace,
  spaceSafeCount,
  spaceSafeLimit,
  holdsSeatInSpace,
  dispatch,
}: CreateCounterfactualSafeArgs): Promise<CreateCounterfactualSafeResult> => {
  const chains: ChainCreationResult[] = []
  for (const { chainId, provider } of networks) {
    const result = await saveCounterfactualSafe({
      chainId,
      safeAddress,
      props,
      name,
      payMethod,
      isUserAuthenticated,
      provider,
      dispatch,
    })
    chains.push({ chainId, ...result })
  }

  const done = { chains, isStepUpPending: false }
  const savedChainIds = chains.filter((chain) => chain.status === 'saved').map((chain) => chain.chainId)
  if (spaceId === null || !isUserAuthenticated || savedChainIds.length === 0) return done

  const notify = (groupKey: string, message: string) =>
    dispatch(showNotification({ variant: 'info', groupKey, message }))

  if (!isAdminOfActiveSpace) {
    notify('cf-safe-space-skipped', 'Safe added to your accounts — ask an admin to add it to the Workspace')
    return done
  }

  if (!holdsSeatInSpace && isSpaceAtSafeLimit(spaceSafeCount, spaceSafeLimit)) {
    notify('cf-safe-space-limit', seatLimitMessage(spaceSafeLimit))
    return done
  }

  const outcome = await addSafesToSpace({ spaceId, safeAddress, chainIds: savedChainIds, dispatch })

  switch (outcome.status) {
    case 'added':
      return done
    case 'stepUpPending':
      return { chains, isStepUpPending: true }
    case 'seatLimit':
      notify('cf-safe-space-limit', seatLimitMessage(outcome.quota ?? spaceSafeLimit))
      return done
    case 'legacyLimit':
      notify('cf-safe-space-limit', outcome.message)
      return done
    case 'failed':
      // The sync listener deletes each one from the backend too, queueing a retry if that fails.
      savedChainIds.forEach((chainId) => dispatch(removeUndeployedSafe({ chainId, address: safeAddress })))
      return {
        chains: chains.map((chain) =>
          chain.status === 'saved' ? { chainId: chain.chainId, status: 'failed', error: outcome.error } : chain,
        ),
        isStepUpPending: false,
      }
  }
}

function seatLimitMessage(limit: SafeLimit): string {
  const seats = typeof limit === 'number' ? `limit of ${limit} Safe accounts` : 'seat limit'
  return `Safe created in My accounts. The Workspace is at its ${seats}, so it wasn't added there.`
}
