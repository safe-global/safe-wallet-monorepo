import { getMultiSendCallOnlyDeployments } from '@safe-global/safe-deployments'
import { hasMatchingDeployment, TRUSTED_DEPLOYMENT_VERSIONS } from '@safe-global/utils/services/contracts/deployments'
import type { Delay } from '@gnosis.pm/zodiac'
import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import type { JsonRpcProvider } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { readDelayState } from '@/services/delay/state'
import type { RecoveryState, RecoveryStateItem } from '../public/types'

type AddedEvent = TransactionAddedEvent.Log

export function _isMaliciousRecovery({
  chainId,
  safeAddress,
  transaction,
}: {
  chainId: string
  safeAddress: string
  transaction: Pick<AddedEvent['args'], 'to' | 'data'>
}) {
  const isMultiSend = isMultiSendCalldata(transaction.data)
  const transactions = isMultiSend ? decodeMultiSendData(transaction.data) : [transaction]

  if (!isMultiSend) {
    // Calling the Safe itself
    return !sameAddress(transaction.to, safeAddress)
  }

  const isOfficialMultiSend = hasMatchingDeployment(
    getMultiSendCallOnlyDeployments,
    transaction.to,
    chainId,
    TRUSTED_DEPLOYMENT_VERSIONS,
  )

  return !isOfficialMultiSend || transactions.some((tx) => !sameAddress(tx.to, safeAddress))
}

type RecoveryStateQuery = { safeAddress: string; provider: JsonRpcProvider; chainId: string }
export const _getRecoveryStateItem = async ({
  safeAddress,
  ...query
}: RecoveryStateQuery & { delayModifier: Delay }): Promise<RecoveryStateItem> => {
  const { modules, ...state } = await readDelayState(query)
  return {
    ...state,
    recoverers: modules,
    queue: state.queue.map((item) => ({
      ...item,
      isMalicious: _isMaliciousRecovery({ chainId: query.chainId, safeAddress, transaction: item.args }),
    })),
  }
}
export function getRecoveryState({
  delayModifiers,
  ...query
}: RecoveryStateQuery & { delayModifiers: Delay[] }): Promise<RecoveryState> {
  return Promise.all(delayModifiers.map((delayModifier) => _getRecoveryStateItem({ delayModifier, ...query })))
}
