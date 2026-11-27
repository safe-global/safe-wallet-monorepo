import { canExecuteQueuedTx } from './canExecuteQueuedTx'
import type { GnosisPayTxItem } from '../types'
const item: GnosisPayTxItem = {
  isNext: true,
  queueNonce: 4,
  txData: { to: '0x0000000000000000000000000000000000000001', value: '0', data: '0x' },
  executableAt: 1000,
  expiresAt: 2000,
}
it.each([
  ['next and ready', 4n, 1000, true],
  ['later', 3n, 1500, false],
  ['already executed', 5n, 1500, false],
  ['unknown nonce', undefined, 1500, false],
  ['cooldown', 4n, 999, false],
  ['expired', 4n, 2000, false],
])('%s', (_, nonce, now, expected) => expect(canExecuteQueuedTx(item, nonce, now)).toBe(expected))
it('allows a never-expiring head after cooldown', () =>
  expect(canExecuteQueuedTx({ ...item, expiresAt: null }, 4n, 99999)).toBe(true))
