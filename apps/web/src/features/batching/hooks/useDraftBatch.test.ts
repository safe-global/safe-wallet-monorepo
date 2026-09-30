import { faker } from '@faker-js/faker'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/types-kit'
import { Multi_send__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { renderHook } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createMockSafeTransaction } from '@/tests/transactions'
import { getStoreInstance } from '@/store'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { txSubscribe, TxEvent } from '@/services/tx/txEvents'
import { useDraftBatch, useUpdateBatch } from './useDraftBatch'
import { selectBatchBySafe } from '../store/batchSlice'

jest.mock('@/hooks/useSafeInfo')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const safeInfo = extendedSafeInfoBuilder().build()
const multiSendInterface = Multi_send__factory.createInterface()

const renderBatchHooks = () =>
  renderHook(() => {
    const [addToBatch] = useUpdateBatch()
    return { addToBatch, batch: useDraftBatch(), chainId: useChainId() }
  })

const selectBatch = (chainId: string) =>
  selectBatchBySafe(getStoreInstance().getState(), chainId, safeInfo.address.value)

describe('useUpdateBatch', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUseSafeInfo.mockReturnValue({
      safe: safeInfo,
      safeAddress: safeInfo.address.value,
      safeLoading: false,
      safeLoaded: true,
      safeError: undefined,
    })
  })

  it('stores a plain call as a single call-only batch item', async () => {
    const to = faker.finance.ethereumAddress()
    const data = faker.string.hexadecimal({ length: 16 }).toLowerCase()
    const safeTx = createMockSafeTransaction({ to, data, value: '1' })

    const { result } = renderBatchHooks()
    await result.current.addToBatch(safeTx)

    expect(selectBatch(result.current.chainId)).toEqual([
      expect.objectContaining({ txData: { to, value: '1', data, operation: OperationType.Call } }),
    ])
  })

  it('splits a multisend into its inner calls', async () => {
    const calls = [
      { to: faker.finance.ethereumAddress(), value: '0', data: '0x', operation: OperationType.Call },
      { to: faker.finance.ethereumAddress(), value: '5', data: '0xabcd', operation: OperationType.Call },
    ]
    const multiSendData = multiSendInterface.encodeFunctionData('multiSend', [encodeMultiSendData(calls)])
    const safeTx = createMockSafeTransaction({
      to: faker.finance.ethereumAddress(),
      data: multiSendData,
      operation: OperationType.DelegateCall,
    })

    const { result } = renderBatchHooks()
    await result.current.addToBatch(safeTx)

    expect(selectBatch(result.current.chainId).map((item) => item.txData)).toEqual(
      calls.map((call) => ({ ...call, to: expect.stringMatching(new RegExp(call.to, 'i')) })),
    )
  })

  it('announces the addition on the tx event bus', async () => {
    const onBatchAdd = jest.fn()
    const unsubscribe = txSubscribe(TxEvent.BATCH_ADD, onBatchAdd)
    const safeTx = createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' })

    const { result } = renderBatchHooks()
    await result.current.addToBatch(safeTx)
    unsubscribe()

    expect(onBatchAdd).toHaveBeenCalledWith({ nonce: safeTx.data.nonce })
  })
})
