import { id } from 'ethers'
import type { TransactionReceipt } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { RHINESTONE_INTENT_EXECUTOR } from '../constants'

const INTENT_EXECUTED_TOPIC = id('IntentExecuted(uint256,bytes32)')

export const isRelayedByRhinestone = (receipt: Pick<TransactionReceipt, 'logs'>): boolean =>
  receipt.logs.some(
    (log) => sameAddress(log.address, RHINESTONE_INTENT_EXECUTOR) && log.topics[0] === INTENT_EXECUTED_TOPIC,
  )
