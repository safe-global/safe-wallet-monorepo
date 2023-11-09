import { SENTINEL_ADDRESS } from '@safe-global/safe-core-sdk/dist/src/utils/constants'
import { BigNumber } from 'ethers'
import type { Delay } from '@gnosis.pm/zodiac'
import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'

import { getDelayModifiers } from '@/services/recovery/delay-modifier'
import useAsync from '../useAsync'
import useSafeInfo from '../useSafeInfo'
import { useWeb3ReadOnly } from '../wallets/web3'
import { getSpendingLimitModuleAddress } from '@/services/contracts/spendingLimitContracts'
import useIntervalCounter from '../useIntervalCounter'
import { useHasFeature } from '../useChains'
import { FEATURES } from '@/utils/chains'
import type { AsyncResult } from '../useAsync'
import type { RecoveryQueueItem, RecoveryState } from '@/store/recoverySlice'

const MAX_PAGE_SIZE = 100
const REFRESH_DELAY = 5 * 60 * 1_000 // 5 minutes

export const _getQueuedTransactionsAdded = (
  transactionsAdded: Array<TransactionAddedEvent>,
  txNonce: BigNumber,
): Array<TransactionAddedEvent> => {
  // Only queued transactions with queueNonce >= current txNonce
  return transactionsAdded.filter(({ args }) => args.queueNonce.gte(txNonce))
}

export const _getRecoveryQueueItem = async (
  transactionAdded: TransactionAddedEvent,
  txCooldown: BigNumber,
  txExpiration: BigNumber,
): Promise<RecoveryQueueItem> => {
  const txBlock = await transactionAdded.getBlock()

  const validFrom = BigNumber.from(txBlock.timestamp).add(txCooldown)
  const expiresAt = txExpiration.isZero()
    ? null // Never expires
    : validFrom.add(txExpiration)

  return {
    ...transactionAdded,
    timestamp: txBlock.timestamp,
    validFrom,
    expiresAt,
  }
}

export const _getRecoveryState = async (delayModifier: Delay): Promise<RecoveryState[number]> => {
  const transactionAddedFilter = delayModifier.filters.TransactionAdded()

  const [[modules], txExpiration, txCooldown, txNonce, queueNonce, transactionsAdded] = await Promise.all([
    delayModifier.getModulesPaginated(SENTINEL_ADDRESS, MAX_PAGE_SIZE),
    delayModifier.txExpiration(),
    delayModifier.txCooldown(),
    delayModifier.txNonce(),
    delayModifier.queueNonce(),
    delayModifier.queryFilter(transactionAddedFilter),
  ])

  const queuedTransactionsAdded = _getQueuedTransactionsAdded(transactionsAdded, txNonce)

  const queue = await Promise.all(
    queuedTransactionsAdded.map((transactionAdded) =>
      _getRecoveryQueueItem(transactionAdded, txCooldown, txExpiration),
    ),
  )

  return {
    address: delayModifier.address,
    modules,
    txExpiration,
    txCooldown,
    txNonce,
    queueNonce,
    queue,
  }
}

const useLoadRecovery = (): AsyncResult<RecoveryState> => {
  const { safe, safeAddress } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const [counter] = useIntervalCounter(REFRESH_DELAY)
  const supportsRecovery = useHasFeature(FEATURES.RECOVERY)

  const [delayModifiers, delayModifiersError, delayModifiersLoading] = useAsync<Array<Delay>>(() => {
    if (!supportsRecovery || !web3ReadOnly || !safe.modules || safe.modules.length === 0) {
      return
    }

    const isOnlySpendingLimit =
      safe.modules.length === 1 && safe.modules[0].value === getSpendingLimitModuleAddress(safe.chainId)

    if (isOnlySpendingLimit) {
      return
    }

    return getDelayModifiers(safe.chainId, safe.modules, web3ReadOnly)
    // Need to check length of modules array to prevent new request every time Safe info polls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeAddress, safe.chainId, safe.modules?.length, web3ReadOnly, supportsRecovery])

  const [recoveryState, recoveryStateError, recoveryStateLoading] = useAsync<RecoveryState>(() => {
    if (!delayModifiers || delayModifiers.length === 0) {
      return
    }

    return Promise.all(delayModifiers.map(_getRecoveryState))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayModifiers, counter])

  return [recoveryState, delayModifiersError || recoveryStateError, delayModifiersLoading || recoveryStateLoading]
}

export default useLoadRecovery
