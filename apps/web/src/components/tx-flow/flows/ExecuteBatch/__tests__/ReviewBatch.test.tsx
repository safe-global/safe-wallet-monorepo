import type { ReactElement } from 'react'
import { render, fireEvent, waitFor } from '@/tests/test-utils'
import { mockCurrentChain, mockSafeInfo } from '@/tests/mocks/hooks'
import { getGs026BatchMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import { Gs026PreCheckError, runBatchExecutionPreChecks } from '@/services/tx/executionPreChecks'
import { dispatchBatchExecution, dispatchBatchExecutionRelay } from '@/services/tx/tx-sender'
import { ReviewBatch } from '../ReviewBatch'

jest.mock('@/services/tx/executionPreChecks', () => ({
  ...jest.requireActual('@/services/tx/executionPreChecks'),
  runBatchExecutionPreChecks: jest.fn(),
}))

jest.mock('@/services/tx/tx-sender', () => ({
  createMultiSendCallOnlyTx: jest.fn().mockResolvedValue(undefined),
  dispatchBatchExecution: jest.fn().mockResolvedValue('0xhash'),
  dispatchBatchExecutionRelay: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/utils/transactions', () => ({
  ...jest.requireActual('@/utils/transactions'),
  getMultiSendTxs: jest
    .fn()
    .mockResolvedValue([{ to: '0x1234567890123456789012345678901234567890', value: '0', data: '0x', operation: 0 }]),
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

jest.mock('@/components/tx-flow/flows/ExecuteBatch/DecodedTxs', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('./../useMultiSendContract', () => ({
  useMultiSendContract: () => ({
    multiSendContract: { getAddress: () => '0x0000000000000000000000000000000000009641', encode: () => '0x' },
    multiSendContractAddress: '0x0000000000000000000000000000000000009641',
  }),
}))

jest.mock('@/hooks/useGasPrice', () => ({
  __esModule: true,
  default: () => [{ maxFeePerGas: 1n, maxPriorityFeePerGas: 1n }, undefined, false],
}))

jest.mock('@/components/tx/AdvancedParams/useUserNonce', () => ({
  __esModule: true,
  default: () => 5,
}))

jest.mock('@/hooks/useChains')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => ({ address: '0x0000000000000000000000000000000000000011', provider: {}, chainId: '1' }),
}))

jest.mock('@/hooks/wallets/useOnboard', () => ({
  __esModule: true,
  default: () => ({}),
}))

jest.mock('@/hooks/useRemainingRelays', () => ({
  useRelaysBySafe: () => [undefined, undefined, false],
}))

jest.mock('@/services/tx/tx-sender/recommendedNonce', () => ({
  fetchRecommendedParams: jest.fn().mockResolvedValue({ safeTxGas: '0' }),
}))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  useSafeShield: () => ({ needsRiskConfirmation: false, isRiskConfirmed: true }),
  useSafeShieldForTxData: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/transactions', () => ({
  useTransactionsGetMultipleTransactionDetailsQuery: () => ({
    data: [
      {
        txId: 'multisig_0x5AFE_17',
        detailedExecutionInfo: { type: 'MULTISIG', nonce: 17, safeTxHash: '0xabc', confirmations: [] },
      },
      {
        txId: 'multisig_0x5AFE_18',
        detailedExecutionInfo: { type: 'MULTISIG', nonce: 18, safeTxHash: '0xdef', confirmations: [] },
      },
    ],
    error: undefined,
    isLoading: false,
  }),
}))

const mockPreChecks = runBatchExecutionPreChecks as jest.MockedFunction<typeof runBatchExecutionPreChecks>

const params = {
  txs: [{ transaction: { id: 'multisig_0x5AFE_17' } }, { transaction: { id: 'multisig_0x5AFE_18' } }],
} as unknown as Parameters<typeof ReviewBatch>[0]['params']

const submit = async (getByText: (text: string) => HTMLElement) => {
  // The encoded batch data is built asynchronously; its heading only renders
  // once it is ready, which is also when the submit handler can do anything
  await waitFor(() => expect(getByText('Data')).toBeInTheDocument())
  await waitFor(() => expect(getByText('Submit')).toBeEnabled())
  fireEvent.click(getByText('Submit'))
}

describe('ReviewBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // NetworkWarning reads the chain list; the auto-mock returns undefined
    ;(jest.requireMock('@/hooks/useChains').default as jest.Mock).mockReturnValue({
      configs: [],
      error: undefined,
      loading: false,
    })
    mockCurrentChain({ chainId: '1', chainName: 'Ethereum' })
    mockSafeInfo({ chainId: '1', nonce: 17, version: '1.4.1', deployed: true })
    mockPreChecks.mockResolvedValue(undefined)
  })

  it('broadcasts once the pre-checks pass', async () => {
    const { getByText } = render(<ReviewBatch params={params} />)

    await submit(getByText)

    await waitFor(() => expect(dispatchBatchExecution).toHaveBeenCalled())
    expect(mockPreChecks).toHaveBeenCalled()
  })

  it('never broadcasts when a pre-check blocks the batch', async () => {
    mockPreChecks.mockRejectedValue(new Gs026PreCheckError('STALE_NONCE', getGs026BatchMessage('STALE_NONCE', 2)))

    const { getByText } = render(<ReviewBatch params={params} />)

    await submit(getByText)

    await waitFor(() => expect(getByText(getGs026BatchMessage('STALE_NONCE', 2))).toBeInTheDocument())
    expect(dispatchBatchExecution).not.toHaveBeenCalled()
    expect(dispatchBatchExecutionRelay).not.toHaveBeenCalled()
  })

  it('runs the pre-checks before the relay path too', async () => {
    mockPreChecks.mockRejectedValue(new Gs026PreCheckError('BAD_SIGNATURE', getGs026BatchMessage('BAD_SIGNATURE', 1)))

    const { getByText } = render(<ReviewBatch params={params} />)

    await submit(getByText)

    await waitFor(() => expect(getByText(getGs026BatchMessage('BAD_SIGNATURE', 1))).toBeInTheDocument())
    expect(dispatchBatchExecutionRelay).not.toHaveBeenCalled()
  })
})
