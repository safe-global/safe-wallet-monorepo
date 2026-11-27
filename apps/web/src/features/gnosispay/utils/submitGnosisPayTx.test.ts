import { getModuleInstance, KnownContracts } from '@gnosis.pm/zodiac'
import type { TransactionResponse } from 'ethers'
import { assertGnosisPayExecution, waitForGnosisPayReceipt } from './submitGnosisPayTx'
import { rpcFixture, DELAY, OWNER } from '../tests/rpcFixture'
import type { GnosisPayTxItem } from '../types'
const fixture = rpcFixture()
const contract = getModuleInstance(KnownContracts.DELAY, DELAY, fixture.provider)
const item: GnosisPayTxItem = {
  isNext: true,
  queueNonce: 4,
  txData: { to: OWNER, value: '0', data: '0x' },
  executableAt: 0,
  expiresAt: null,
}
beforeEach(() => fixture.server.use(fixture.handler))
afterAll(() => {
  fixture.provider.destroy()
})
beforeEach(() =>
  Object.assign(fixture.values, { owner: true, nonce: 4n, created: 1n, cooldown: 1n, expiry: 0n, fail: false }),
)
it('accepts an authorized ready head with no expiration', async () =>
  await expect(assertGnosisPayExecution(contract, OWNER, item)).resolves.toBeUndefined())
it('rejects a revoked owner even when the UI was authorized', async () => {
  fixture.values.owner = false
  await expect(assertGnosisPayExecution(contract, OWNER, item)).rejects.toThrow('not a Gnosis Pay owner')
})
it.each([3n, 5n])('rejects a stale queue nonce %s', async (nonce) => {
  fixture.values.nonce = nonce
  await expect(assertGnosisPayExecution(contract, OWNER, item)).rejects.toThrow('not next')
})
it('rejects a cooldown still in progress', async () => {
  fixture.values.created = BigInt(Math.floor(Date.now() / 1000))
  fixture.values.cooldown = 180n
  await expect(assertGnosisPayExecution(contract, OWNER, item)).rejects.toThrow('cooldown')
})
it('rejects expired queue entries', async () => {
  fixture.values.expiry = 1n
  await expect(assertGnosisPayExecution(contract, OWNER, item)).rejects.toThrow('expired')
})
it('fails closed on a contract-read error', async () => {
  fixture.values.fail = true
  await expect(assertGnosisPayExecution(contract, OWNER, item)).rejects.toThrow()
})
it.each([undefined, null])('rejects a missing receipt %s', async (receipt) => {
  await expect(
    waitForGnosisPayReceipt({ wait: async () => receipt } as unknown as TransactionResponse),
  ).rejects.toThrow('No transaction receipt')
})
it('rejects a reverted receipt', async () => {
  await expect(
    waitForGnosisPayReceipt({ wait: async () => ({ status: 0 }) } as unknown as TransactionResponse),
  ).rejects.toThrow('reverted')
})
