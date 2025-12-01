import { Safe__factory } from '@safe-global/utils/types/contracts'
import type { SafeTransaction } from '@safe-global/types-kit'

import { detectNestedTransaction } from '../useNestedTransaction'

const safeInterface = Safe__factory.createInterface()

const APPROVE_HASH = `0x${'a'.repeat(64)}`
const NESTED_SAFE_ADDRESS = '0x00000000000000000000000000000000000000aa'
const CHILD_SAFE_ADDRESS = '0x00000000000000000000000000000000000000bb'
const GAS_TOKEN_ADDRESS = '0x00000000000000000000000000000000000000cc'
const REFUND_RECEIVER_ADDRESS = '0x00000000000000000000000000000000000000dd'

describe('detectNestedTransaction', () => {
  it('detects approveHash transactions', () => {
    const safeTx = buildSafeTransaction(encodeApproveHash(APPROVE_HASH))

    const result = detectNestedTransaction(safeTx)

    expect(result).toEqual({
      type: 'approveHash',
      signedHash: APPROVE_HASH,
      nestedSafeAddress: NESTED_SAFE_ADDRESS,
    })
  })

  it('detects execTransaction transactions', () => {
    const execParams = {
      to: CHILD_SAFE_ADDRESS,
      data: '0x1234',
    }
    const safeTx = buildSafeTransaction(encodeExecTransaction(execParams))

    const result = detectNestedTransaction(safeTx)

    expect(result).toMatchObject({
      type: 'execTransaction',
      nestedSafeAddress: NESTED_SAFE_ADDRESS,
      txParams: expect.objectContaining({
        to: CHILD_SAFE_ADDRESS,
        data: '0x1234',
        gasToken: GAS_TOKEN_ADDRESS,
        refundReceiver: REFUND_RECEIVER_ADDRESS,
      }),
    })
  })

  it('returns null when the calldata cannot be decoded', () => {
    const safeTx = buildSafeTransaction('0xdeadbeef')

    expect(detectNestedTransaction(safeTx)).toBeNull()
  })
})

const buildSafeTransaction = (data: string): SafeTransaction => ({
  addSignature: jest.fn(),
  encodedSignatures: jest.fn(),
  getSignature: jest.fn(),
  signatures: new Map(),
  data: {
    to: NESTED_SAFE_ADDRESS,
    value: '0',
    data,
    operation: 0,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: GAS_TOKEN_ADDRESS,
    refundReceiver: REFUND_RECEIVER_ADDRESS,
    nonce: 0,
  },
})

const encodeApproveHash = (hash: string): string => safeInterface.encodeFunctionData('approveHash', [hash])

const encodeExecTransaction = ({
  to,
  value = 0,
  data = '0x',
  operation = 0,
  safeTxGas = 0,
  baseGas = 0,
  gasPrice = 0,
  gasToken = GAS_TOKEN_ADDRESS,
  refundReceiver = REFUND_RECEIVER_ADDRESS,
}: {
  to: string
  value?: number | string
  data?: string
  operation?: number
  safeTxGas?: number | string
  baseGas?: number | string
  gasPrice?: number | string
  gasToken?: string
  refundReceiver?: string
}): string =>
  safeInterface.encodeFunctionData('execTransaction', [
    to,
    value,
    data,
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    '0x',
  ])
