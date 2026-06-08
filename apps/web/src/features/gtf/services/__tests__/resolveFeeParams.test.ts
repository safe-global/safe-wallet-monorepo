import type { SafeTransaction } from '@safe-global/types-kit'

import { resolveFeeParams } from '../resolveFeeParams'
import { createTx } from '@/services/tx/tx-sender'
import { gatewayApi } from '@/store/api/gateway'
import { createSafeTx } from '@/tests/builders/safeTx'
import type { AppDispatch } from '@/store'

jest.mock('@/services/tx/tx-sender', () => ({
  createTx: jest.fn(),
}))

const mockTrackError = jest.fn()
jest.mock('@/services/exceptions', () => ({
  trackError: (...args: unknown[]) => mockTrackError(...args),
  Errors: { _821: '821: Untrusted gas-fee refundReceiver returned by CGW' },
}))

jest.mock('@/store/api/gateway', () => ({
  gatewayApi: {
    endpoints: {
      getGtfFeePreview: {
        initiate: jest.fn(),
      },
    },
  },
}))

const mockCreateTx = createTx as jest.MockedFunction<typeof createTx>
const mockInitiate = gatewayApi.endpoints.getGtfFeePreview.initiate as unknown as jest.Mock

const buildDispatch = (thunkResult: unknown): AppDispatch => {
  return jest.fn(() => thunkResult) as unknown as AppDispatch
}

const buildThunk = (unwrapResult: Promise<unknown>) => ({
  unwrap: jest.fn(() => unwrapResult),
})

describe('resolveFeeParams', () => {
  const safeTx: SafeTransaction = createSafeTx()

  const previewResponse = {
    txData: {
      chainId: 1,
      safeAddress: '0xsafe',
      safeTxGas: '150000',
      baseGas: '48564',
      gasPrice: '195000000000000',
      gasToken: '0xa0b86991000000000000000000000000000000aa',
      refundReceiver: '0xaEf22e5f09980fC1Ba6F2ec3EC34c1B9aeC885b5',
      numberSignatures: 3,
    },
    relayCost: { fiatCode: 'USD', fiatValue: '38.22' },
    pricingContextSnapshot: { phase: 1, priceSource: 'coingecko', priceTimestamp: 0, gasPriceVolatilityBuffer: 1.3 },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('dispatches the preview with forceRefetch and merges txData fields into a new SafeTransaction', async () => {
    const mergedTx = createSafeTx('0xmerged')
    mockCreateTx.mockResolvedValue(mergedTx)
    const thunkArg = { kind: 'thunk' }
    mockInitiate.mockReturnValue(thunkArg)

    const dispatch = buildDispatch(buildThunk(Promise.resolve(previewResponse)))

    const result = await resolveFeeParams({
      chainId: '1',
      safeAddress: '0xsafe',
      safeTx,
      gasToken: '0xa0b86991000000000000000000000000000000aa',
      numberSignatures: 3,
      dispatch,
    })

    expect(mockInitiate).toHaveBeenCalledWith(
      {
        chainId: '1',
        safeAddress: '0xsafe',
        tx: {
          to: safeTx.data.to,
          value: safeTx.data.value,
          data: safeTx.data.data,
          operation: safeTx.data.operation,
          gasToken: '0xa0b86991000000000000000000000000000000aa',
          numberSignatures: 3,
          fiatCode: 'USD',
        },
      },
      { forceRefetch: true },
    )
    expect(dispatch).toHaveBeenCalledWith(thunkArg)

    expect(mockCreateTx).toHaveBeenCalledWith(
      expect.objectContaining({
        safeTxGas: '150000',
        baseGas: '48564',
        gasPrice: '195000000000000',
        gasToken: '0xa0b86991000000000000000000000000000000aa',
        refundReceiver: '0xaEf22e5f09980fC1Ba6F2ec3EC34c1B9aeC885b5',
      }),
      safeTx.data.nonce,
    )
    expect(result).toBe(mergedTx)
  })

  it('throws when CGW returns an unknown refundReceiver (defense-in-depth)', async () => {
    const tampered = {
      ...previewResponse,
      txData: { ...previewResponse.txData, refundReceiver: '0xattacker0000000000000000000000000000aaaa' },
    }
    mockInitiate.mockReturnValue({ kind: 'thunk' })
    const dispatch = buildDispatch(buildThunk(Promise.resolve(tampered)))

    await expect(
      resolveFeeParams({
        chainId: '1',
        safeAddress: '0xsafe',
        safeTx,
        gasToken: '0xa0b86991000000000000000000000000000000aa',
        numberSignatures: 3,
        dispatch,
      }),
    ).rejects.toThrow(/untrusted refundReceiver/)

    expect(mockCreateTx).not.toHaveBeenCalled()
    expect(mockTrackError).toHaveBeenCalledWith(
      expect.stringContaining('821'),
      expect.stringContaining('Untrusted GTF refundReceiver'),
    )
  })

  it('propagates errors from the preview dispatch', async () => {
    mockInitiate.mockReturnValue({ kind: 'thunk' })
    const dispatch = buildDispatch(buildThunk(Promise.reject(new Error('CGW 403'))))

    await expect(
      resolveFeeParams({
        chainId: '1',
        safeAddress: '0xsafe',
        safeTx,
        gasToken: '0xa0b86991000000000000000000000000000000aa',
        numberSignatures: 3,
        dispatch,
      }),
    ).rejects.toThrow('CGW 403')

    expect(mockCreateTx).not.toHaveBeenCalled()
  })
})
