import type { ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { faker } from '@faker-js/faker'
import { render, waitFor } from '@/tests/test-utils'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxContext'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { createTx } from '@/services/tx/tx-sender'
import ReviewSafeAppsTx from './ReviewSafeAppsTx'

jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/services/tx/tx-sender', () => ({
  createTx: jest.fn(),
  createMultiSendCallOnlyTx: jest.fn(),
}))
jest.mock('@/hooks/useHighlightHiddenTab', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const mockUseSafeSDK = useSafeSDK as jest.MockedFunction<typeof useSafeSDK>
const mockCreateTx = createTx as jest.MockedFunction<typeof createTx>

const contextValue = (overrides: Partial<SafeTxContextParams>): SafeTxContextParams => ({
  setSafeTx: jest.fn(),
  setSafeMessage: jest.fn(),
  setSafeMessageHash: jest.fn(),
  setSafeTxError: jest.fn(),
  setNonce: jest.fn(),
  setNonceNeeded: jest.fn(),
  setSafeTxGas: jest.fn(),
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: jest.fn(),
  setGtfSelectedGasToken: jest.fn(),
  ...overrides,
})

describe('ReviewSafeAppsTx', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('waits for the Safe SDK before it creates the transaction', async () => {
    const safeTx = { data: {} } as SafeTransaction
    mockCreateTx.mockResolvedValue(safeTx)
    mockUseSafeSDK.mockReturnValue(undefined)
    const context = contextValue({})
    const safeAppsTx = {
      requestId: faker.string.uuid(),
      txs: [{ to: faker.finance.ethereumAddress(), value: '0', data: '0x' }],
    }
    const review = () => (
      <SafeTxContext.Provider value={context}>
        <ReviewSafeAppsTx safeAppsTx={safeAppsTx} onSubmit={jest.fn()} />
      </SafeTxContext.Provider>
    )

    const { rerender } = render(review())

    expect(mockCreateTx).not.toHaveBeenCalled()
    expect(context.setSafeTxError).not.toHaveBeenCalled()

    mockUseSafeSDK.mockReturnValue({} as Safe)
    rerender(review())

    await waitFor(() => expect(context.setSafeTx).toHaveBeenCalledWith(safeTx))
    expect(mockCreateTx).toHaveBeenCalledTimes(1)
  })
})
