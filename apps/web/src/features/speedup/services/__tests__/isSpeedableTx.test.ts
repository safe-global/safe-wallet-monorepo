import { PendingStatus, PendingTxType, type PendingProcessingTx } from '@/store/pendingTxsSlice'
import { pendingTxBuilder } from '@/tests/builders/pendingTx'
import { isSpeedableTx } from '../isSpeedableTx'

describe('isSpeedableTx', () => {
  it('returns true when all conditions are met', () => {
    const pendingTx: PendingProcessingTx = {
      ...pendingTxBuilder().with({ status: PendingStatus.PROCESSING }).build(),
      txHash: '0x123',
      submittedAt: Date.now(),
      signerNonce: 1,
      signerAddress: '0xabc',
      status: PendingStatus.PROCESSING,
      txType: PendingTxType.SAFE_TX,
    }

    const isSmartContract = false
    const walletAddress = '0xabc'

    const result = isSpeedableTx(pendingTx, isSmartContract, walletAddress)

    expect(result).toBe(true)
  })

  it('returns false when one of the conditions is not met', () => {
    const pendingTx: PendingProcessingTx = {
      ...pendingTxBuilder().with({ status: PendingStatus.PROCESSING }).build(),
      txHash: '0x123',
      submittedAt: Date.now(),
      signerNonce: 1,
      signerAddress: '0xabc',
      status: PendingStatus.PROCESSING,
      txType: PendingTxType.SAFE_TX,
    }

    const isSmartContract = true
    const walletAddress = '0xabc'

    const result = isSpeedableTx(pendingTx, isSmartContract, walletAddress)

    expect(result).toBe(false)
  })
})
