import type { SafeTransaction } from '@safe-global/types-kit'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit'
import { decodeNestedApproval, confirmNestedApprovalOnExecution } from './confirmNestedApproval'
import * as addConfirmationModule from '@/services/tx/addConfirmation'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'

const safeInterface = Safe__factory.createInterface()

const CHILD_ADDRESS = '0x2222222222222222222222222222222222222222'
const PARENT_ADDRESS = '0x1111111111111111111111111111111111111111'
const CHILD_SAFE_TX_HASH = '0x' + 'ab'.repeat(32)
const PARENT_TX_ID = 'multisig_0xparent'
const CHILD_CHAIN_ID = '11155111'

const approveHashData = safeInterface.encodeFunctionData('approveHash', [CHILD_SAFE_TX_HASH])

const createSafeTx = (to: string, data: string): SafeTransaction =>
  ({ data: { to, data, value: '0', operation: 0 }, signatures: new Map() }) as unknown as SafeTransaction

describe('decodeNestedApproval', () => {
  it('extracts the child address and hash from an approveHash tx', () => {
    const result = decodeNestedApproval(createSafeTx(CHILD_ADDRESS, approveHashData))

    expect(result).toEqual({ childSafeAddress: CHILD_ADDRESS, childSafeTxHash: CHILD_SAFE_TX_HASH })
  })

  it('returns undefined for a non-approveHash tx', () => {
    expect(decodeNestedApproval(createSafeTx(CHILD_ADDRESS, '0xdeadbeef'))).toBeUndefined()
    expect(decodeNestedApproval(createSafeTx(CHILD_ADDRESS, '0x'))).toBeUndefined()
  })
})

describe('confirmNestedApprovalOnExecution', () => {
  let addConfirmationSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    addConfirmationSpy = jest.spyOn(addConfirmationModule, 'default').mockResolvedValue({} as never)
  })

  it('submits the parent prevalidated confirmation to the child when TX_P is processed', async () => {
    confirmNestedApprovalOnExecution(
      PARENT_TX_ID,
      PARENT_ADDRESS,
      CHILD_CHAIN_ID,
      createSafeTx(CHILD_ADDRESS, approveHashData),
    )

    txDispatch(TxEvent.PROCESSED, {
      txId: PARENT_TX_ID,
      nonce: 0,
      chainId: CHILD_CHAIN_ID,
      safeAddress: PARENT_ADDRESS,
    })

    // Allow the async subscriber to run
    await Promise.resolve()

    expect(addConfirmationSpy).toHaveBeenCalledWith(
      CHILD_CHAIN_ID,
      CHILD_SAFE_TX_HASH,
      generatePreValidatedSignature(PARENT_ADDRESS).data,
    )
  })

  it('does not subscribe for a non-approveHash tx', () => {
    confirmNestedApprovalOnExecution(PARENT_TX_ID, PARENT_ADDRESS, CHILD_CHAIN_ID, createSafeTx(CHILD_ADDRESS, '0x'))

    txDispatch(TxEvent.PROCESSED, {
      txId: PARENT_TX_ID,
      nonce: 0,
      chainId: CHILD_CHAIN_ID,
      safeAddress: PARENT_ADDRESS,
    })

    expect(addConfirmationSpy).not.toHaveBeenCalled()
  })

  it('ignores PROCESSED events for other transactions', () => {
    confirmNestedApprovalOnExecution(
      PARENT_TX_ID,
      PARENT_ADDRESS,
      CHILD_CHAIN_ID,
      createSafeTx(CHILD_ADDRESS, approveHashData),
    )

    txDispatch(TxEvent.PROCESSED, {
      txId: 'multisig_0xother',
      nonce: 0,
      chainId: CHILD_CHAIN_ID,
      safeAddress: PARENT_ADDRESS,
    })

    expect(addConfirmationSpy).not.toHaveBeenCalled()
  })
})
