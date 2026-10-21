import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

import recoveryStore from './components/RecoveryContext'
import { RecoveryEvent, RecoveryTxType } from './services/recoveryEvents'
import type { RecoveryQueueItem, RecoveryStateItem } from './services/recovery-state'

const DAY_IN_MS = 24 * 60 * 60 * 1_000

export const NOW = Date.now()

export type RecoveryScenario = {
  validFrom: number
  expiresAt?: number | bigint | null
  queueNonce?: number
  modifierTxNonce?: number
  pendingStatus?: RecoveryEvent
}

export const RECOVERY_SCENARIOS = {
  waiting: { validFrom: NOW + DAY_IN_MS },
  executable: { validFrom: NOW - DAY_IN_MS, expiresAt: NOW + DAY_IN_MS },
  executableWithoutExpiry: { validFrom: NOW - DAY_IN_MS, expiresAt: null },
  executableBeyondMaxDate: {
    validFrom: NOW - DAY_IN_MS,
    expiresAt: BigInt(NOW - 2 * DAY_IN_MS) + BigInt(DAY_IN_MS) * BigInt(1_000_000_000),
  },
  expired: { validFrom: NOW - 2 * DAY_IN_MS, expiresAt: NOW - DAY_IN_MS },
  notNext: { validFrom: NOW - DAY_IN_MS, queueNonce: 1, modifierTxNonce: 0 },
  notNextWaiting: { validFrom: NOW + DAY_IN_MS, queueNonce: 1, modifierTxNonce: 0 },
  processing: { validFrom: NOW - DAY_IN_MS, pendingStatus: RecoveryEvent.PROCESSING },
  processed: { validFrom: NOW - DAY_IN_MS, pendingStatus: RecoveryEvent.PROCESSED },
  expiredProcessing: {
    validFrom: NOW - 2 * DAY_IN_MS,
    expiresAt: NOW - DAY_IN_MS,
    pendingStatus: RecoveryEvent.PROCESSING,
  },
} satisfies Record<string, RecoveryScenario>

export type RecoveryScenarioName = keyof typeof RECOVERY_SCENARIOS

const fakeAddress = () => checksumAddress(faker.finance.ethereumAddress())
const fakeHash = () => faker.string.hexadecimal({ length: 64, casing: 'lower' })

function createRecoveryQueueItem({ validFrom, expiresAt = null, queueNonce = 0 }: RecoveryScenario): RecoveryQueueItem {
  const item = {
    address: fakeAddress(),
    transactionHash: fakeHash(),
    timestamp: BigInt(validFrom - DAY_IN_MS),
    validFrom: BigInt(validFrom),
    expiresAt: expiresAt === null ? null : BigInt(expiresAt),
    isMalicious: false,
    executor: fakeAddress(),
    args: {
      queueNonce: BigInt(queueNonce),
      txHash: fakeHash(),
      to: fakeAddress(),
      value: BigInt(0),
      operation: BigInt(0),
      data: '0x',
    },
  }

  return item as unknown as RecoveryQueueItem
}

function toDelayModifier(item: RecoveryQueueItem, txNonce: number): RecoveryStateItem {
  return {
    address: item.address,
    recoverers: [fakeAddress()],
    expiry: BigInt(0),
    delay: BigInt(0),
    txNonce: BigInt(txNonce),
    queueNonce: item.args.queueNonce + BigInt(1),
    queue: [item],
  }
}

function toPendingTxs(item: RecoveryQueueItem, status?: RecoveryEvent) {
  return status ? { [item.args.txHash]: { status, txType: RecoveryTxType.EXECUTION } } : {}
}

/**
 * Puts a recovery proposal for the given scenario into the recovery store.
 *
 * @param name - the state the proposal is in, relative to {@link NOW}
 * @returns the queued proposal, as the components receive it
 */
export function seedRecoveryScenario(name: RecoveryScenarioName): RecoveryQueueItem {
  const scenario: RecoveryScenario = RECOVERY_SCENARIOS[name]
  const item = createRecoveryQueueItem(scenario)
  const txNonce = scenario.modifierTxNonce ?? scenario.queueNonce ?? 0

  recoveryStore.setStore({
    state: [[toDelayModifier(item, txNonce)], undefined, false],
    pending: toPendingTxs(item, scenario.pendingStatus),
  })

  return item
}
