import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { PendingStatus, type PendingTx } from '@/store/pendingTxsSlice'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useTransactionStatus from '../useTransactionStatus'

const txId = 'multisig_0x123_0xabc'
const chainId = '1'
const safeAddress = faker.finance.ethereumAddress()

const txSummary = {
  id: txId,
  txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
  txInfo: { type: 'Transfer' },
} as unknown as Transaction

const nestedPendingTx = (executed: boolean): PendingTx => ({
  chainId,
  safeAddress,
  nonce: 1,
  status: PendingStatus.NESTED_SIGNING,
  signerAddress: faker.finance.ethereumAddress(),
  txHashOrParentSafeTxHash: faker.string.hexadecimal({ length: 64 }),
  executed,
  method: 'approveHash',
})

const render = (pendingTx?: PendingTx) =>
  renderHook(() => useTransactionStatus(txSummary), {
    initialReduxState: { pendingTxs: pendingTx ? { [txId]: pendingTx } : {} },
  })

describe('useTransactionStatus', () => {
  it('returns the gateway status when the tx is not pending', () => {
    expect(render().result.current).toBe('Awaiting confirmations')
  })

  it('returns "Awaiting parent signature" while the child tx is only queued in the parent Safe', () => {
    expect(render(nestedPendingTx(false)).result.current).toBe('Awaiting parent signature')
  })

  it('returns "Signing" when the parent Safe executed the nested call immediately', () => {
    expect(render(nestedPendingTx(true)).result.current).toBe('Signing')
  })

  it('returns "Signing" for a plain signing pending tx', () => {
    const pendingTx: PendingTx = {
      chainId,
      safeAddress,
      nonce: 1,
      status: PendingStatus.SIGNING,
      signerAddress: faker.finance.ethereumAddress(),
    }
    expect(render(pendingTx).result.current).toBe('Signing')
  })
})
