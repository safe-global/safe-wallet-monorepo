import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import addConfirmation from './addConfirmation'
import * as store from '@/store'

describe('addConfirmation', () => {
  const chainId = '11155111'
  const safeTxHash = '0x' + 'ab'.repeat(32)
  const signature = '0x' + 'cd'.repeat(65)

  const mockDispatch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(store, 'getStoreInstance')
      // Only `dispatch` is used by the service under test.
      .mockReturnValue({ dispatch: mockDispatch } as unknown as ReturnType<typeof store.getStoreInstance>)
  })

  it('dispatches transactionsAddConfirmationV1 with the chainId, safeTxHash and signature', async () => {
    const txDetails = { txId: 'multisig_0x123', txHash: safeTxHash }
    mockDispatch.mockResolvedValue({ data: txDetails })

    const initiateSpy = jest.spyOn(cgwApi.endpoints.transactionsAddConfirmationV1, 'initiate')

    const result = await addConfirmation(chainId, safeTxHash, signature)

    expect(initiateSpy).toHaveBeenCalledWith({
      chainId,
      safeTxHash,
      addConfirmationDto: { signature },
    })
    expect(result).toBe(txDetails)
  })

  it('throws when the gateway returns an error', async () => {
    mockDispatch.mockResolvedValue({ error: { status: 422, data: 'Invalid signature' } })

    await expect(addConfirmation(chainId, safeTxHash, signature)).rejects.toThrow()
  })
})
