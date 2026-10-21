import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { getSafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import type { SafeTransaction } from '@safe-global/types-kit'
import { renderHook, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { safeTxBuilder, safeTxDataBuilder } from '@/tests/builders/safeTx'
import { transactionDetailsBuilder } from '@/tests/builders/transactionDetails'

import { detectNestedTransaction, useNestedTransaction } from '../useNestedTransaction'

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getSafeInfo: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/transactions'),
  useTransactionsGetTransactionByIdV1Query: jest.fn(),
}))

const mockGetSafeInfo = getSafeInfo as jest.Mock
const mockUseTxByIdQuery = useTransactionsGetTransactionByIdV1Query as jest.Mock

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

describe('useNestedTransaction', () => {
  const chain = chainBuilder().build()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSafeInfo.mockResolvedValue(safeInfoBuilder().build())
    mockUseTxByIdQuery.mockReturnValue({ data: transactionDetailsBuilder().build(), isLoading: false })
  })

  it('keeps the nested data when the same transaction is reloaded', async () => {
    const createdTx = buildApproveHashTx(faker.string.hexadecimal({ length: 64, casing: 'lower' }))
    const reloadedTx = safeTxBuilder()
      .with({ data: { ...createdTx.data, to: getAddress(createdTx.data.to) } })
      .build()

    const { result, rerender } = renderHook(({ safeTx }) => useNestedTransaction(safeTx, chain), {
      initialProps: { safeTx: createdTx },
    })

    await waitFor(() => {
      expect(result.current.isNested).toBe(true)
    })
    const { nestedSafeTx } = result.current

    rerender({ safeTx: reloadedTx })

    expect(result.current.isNested).toBe(true)
    expect(result.current.isNestedLoading).toBe(false)
    expect(result.current.nestedSafeTx).toBe(nestedSafeTx)
    expect(mockGetSafeInfo).toHaveBeenCalledTimes(1)
  })

  it('detects the nested transaction again when the approved hash changes', async () => {
    const createdTx = buildApproveHashTx(faker.string.hexadecimal({ length: 64, casing: 'lower' }))
    const otherHash = faker.string.hexadecimal({ length: 64, casing: 'lower' })
    const otherTx = safeTxBuilder()
      .with({ data: { ...createdTx.data, data: encodeApproveHash(otherHash) } })
      .build()

    const { result, rerender } = renderHook(({ safeTx }) => useNestedTransaction(safeTx, chain), {
      initialProps: { safeTx: createdTx },
    })

    await waitFor(() => {
      expect(result.current.isNested).toBe(true)
    })

    rerender({ safeTx: otherTx })

    await waitFor(() => {
      expect(mockGetSafeInfo).toHaveBeenCalledTimes(2)
    })
    expect(mockUseTxByIdQuery).toHaveBeenLastCalledWith(
      { chainId: chain.chainId, id: otherHash },
      expect.objectContaining({ skip: false }),
    )
  })
})

const buildApproveHashTx = (hash: string): SafeTransaction =>
  safeTxBuilder()
    .with({
      data: safeTxDataBuilder()
        .with({ to: faker.finance.ethereumAddress(), data: encodeApproveHash(hash) })
        .build(),
    })
    .build()

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
