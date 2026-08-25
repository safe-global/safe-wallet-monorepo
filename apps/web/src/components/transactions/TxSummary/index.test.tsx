import type { MultisigTransaction, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import {
  ConflictType,
  DetailedExecutionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransferDirection,
  TransactionInfoType,
  TransactionTokenType,
} from '@safe-global/store/gateway/types'

import TxSummary from '@/components/transactions/TxSummary/index'
import { waitFor } from '@testing-library/react'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildBenignSnapshot, buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import * as pending from '@/hooks/useIsPending'
import * as useChainsModule from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { render } from '@/tests/test-utils'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn().mockReturnValue({
    snapshot: undefined,
    status: 'UNAVAILABLE',
    publicStatus: 'UNAVAILABLE',
    isLoading: false,
    isFetching: false,
    isStale: false,
    refetch: jest.fn(),
  }),
}))

const mockTransaction: MultisigTransaction = {
  type: TransactionListItemType.TRANSACTION,
  transaction: {
    timestamp: Date.now(),
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce: 7,
      confirmationsRequired: 3,
      confirmationsSubmitted: 1,
      missingSigners: [
        { value: '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC' },
        { value: '0x0000000000000000000000000000000000000789' },
      ],
    },
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      direction: TransferDirection.OUTGOING,
      transferInfo: {
        value: '1000000',
        type: TransactionTokenType.NATIVE_COIN,
      },
    },
    txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
  } as unknown as Transaction,
  conflictType: ConflictType.HAS_NEXT,
}

const mockTransactionWithoutExecutionInfo = {
  ...mockTransaction,
  transaction: { ...mockTransaction.transaction, executionInfo: undefined },
}

const mockTransactionInHistory = {
  ...mockTransaction,
  transaction: { ...mockTransaction.transaction, txStatus: TransactionStatus.SUCCESS },
}

describe('TxSummary', () => {
  it('should display a nonce if transaction is not grouped', () => {
    const { getByText } = render(<TxSummary item={mockTransaction} isConflictGroup={false} />)

    expect(getByText('7')).toBeInTheDocument()
  })

  it('should not display a nonce if transaction is grouped', () => {
    const { queryByText } = render(<TxSummary item={mockTransaction} isConflictGroup={true} />)

    expect(queryByText('7')).not.toBeInTheDocument()
  })

  it('should not display a nonce if there is no executionInfo', () => {
    const { queryByText } = render(<TxSummary item={mockTransactionWithoutExecutionInfo} isConflictGroup={true} />)

    expect(queryByText('7')).not.toBeInTheDocument()
  })

  it('should display a nonce for items in a bulk execution group', () => {
    const { getByTestId } = render(<TxSummary item={mockTransaction} isBulkGroup={true} isConflictGroup={false} />)

    expect(getByTestId('nonce')).toHaveTextContent('7')
  })

  it('should not display a nonce for items in a bulk execution group without executionInfo', () => {
    const { queryByTestId } = render(
      <TxSummary item={mockTransactionWithoutExecutionInfo} isBulkGroup={true} isConflictGroup={false} />,
    )

    expect(queryByTestId('nonce')).not.toBeInTheDocument()
  })

  it('should show the imitation warning instead of the nonce, not on top of it', () => {
    const imitationTx = {
      ...mockTransaction,
      transaction: {
        ...mockTransaction.transaction,
        txInfo: {
          type: TransactionInfoType.TRANSFER,
          direction: TransferDirection.INCOMING,
          transferInfo: {
            type: TransactionTokenType.ERC20,
            value: '1000000',
            trusted: false,
            imitation: true,
          },
        },
      } as unknown as Transaction,
    }

    const { getByTestId, queryByTestId } = render(<TxSummary item={imitationTx} isConflictGroup={false} />)

    expect(getByTestId('warning')).toBeInTheDocument()
    expect(queryByTestId('nonce')).not.toBeInTheDocument()
  })

  it('should display confirmations if transactions is in queue', () => {
    const { getByText } = render(<TxSummary item={mockTransaction} isConflictGroup={false} />)

    expect(getByText('1/3')).toBeInTheDocument()
  })

  it('should not display confirmations if transactions is already executed', () => {
    const { queryByText } = render(<TxSummary item={mockTransactionInHistory} isConflictGroup={false} />)

    expect(queryByText('1/3')).not.toBeInTheDocument()
  })

  it('should not display confirmations if there is no executionInfo', () => {
    const { queryByText } = render(<TxSummary item={mockTransactionWithoutExecutionInfo} isConflictGroup={false} />)

    expect(queryByText('1/3')).not.toBeInTheDocument()
  })

  it('should display a Sign button if confirmations are missing', () => {
    const { getByText } = render(<TxSummary item={mockTransaction} isConflictGroup={false} />)

    expect(getByText('Confirm')).toBeInTheDocument()
  })

  it('should display a status label if transaction is in queue and pending', () => {
    jest.spyOn(pending, 'default').mockReturnValue(true)
    const { getByTestId } = render(<TxSummary item={mockTransaction} isConflictGroup={false} />)

    expect(getByTestId('tx-status-label')).toBeInTheDocument()
  })

  it('should display a status label if transaction is not in queue', () => {
    jest.spyOn(pending, 'default').mockReturnValue(true)
    const { getByTestId } = render(<TxSummary item={mockTransactionInHistory} isConflictGroup={false} />)

    expect(getByTestId('tx-status-label')).toBeInTheDocument()
  })

  it('should not display a status label if transaction is in queue and not pending', () => {
    jest.spyOn(pending, 'default').mockReturnValue(false)
    const { queryByTestId } = render(<TxSummary item={mockTransaction} isConflictGroup={false} />)

    expect(queryByTestId('tx-status-label')).not.toBeInTheDocument()
  })

  describe('Safenet queue status', () => {
    const safenetTxHash = `0x${'ab'.repeat(32)}`
    const mockQueuedWithId = {
      ...mockTransaction,
      transaction: {
        ...mockTransaction.transaction,
        id: `multisig_0x0000000000000000000000000000000000000123_${safenetTxHash}`,
        timestamp: 1_700_000_000_000,
      },
    }

    let hasFeatureSpy: jest.SpyInstance

    beforeEach(() => {
      hasFeatureSpy = jest
        .spyOn(useChainsModule, 'useHasFeature')
        .mockImplementation((feature) => feature === FEATURES.SAFENET_CHECKS)
      const mocked = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
      mocked.mockReturnValue(
        buildCheckView({
          snapshot: buildBenignSnapshot({ safeTxHash: safenetTxHash as `0x${string}` }),
          status: CheckStatus.BENIGN,
          publicStatus: CheckStatus.BENIGN,
        }),
      )
    })

    afterEach(() => {
      hasFeatureSpy.mockRestore()
    })

    it('mounts the indicator for a queued transaction with the flag on', async () => {
      const { getByTestId } = render(<TxSummary item={mockQueuedWithId} isConflictGroup={false} />)

      // The feature chunk loads lazily.
      await waitFor(() => expect(getByTestId('safenet-queue-status')).toHaveTextContent('No issues found'))
      expect(useSafenetCheck).toHaveBeenCalledWith(safenetTxHash, 1_700_000_000_000)
    })

    it('never mounts the indicator on a history row', async () => {
      const historyItem = {
        ...mockQueuedWithId,
        transaction: { ...mockQueuedWithId.transaction, txStatus: TransactionStatus.SUCCESS },
      }
      const { queryByTestId } = render(<TxSummary item={historyItem} isConflictGroup={false} />)

      await waitFor(() => expect(queryByTestId('safenet-queue-status')).not.toBeInTheDocument())
    })

    it('never mounts the indicator with the flag off', async () => {
      hasFeatureSpy.mockReturnValue(false)
      const { queryByTestId } = render(<TxSummary item={mockQueuedWithId} isConflictGroup={false} />)

      await waitFor(() => expect(queryByTestId('safenet-queue-status')).not.toBeInTheDocument())
    })

    it('never mounts the indicator on a bulk-group row (hidden cells must not read the chain)', async () => {
      const { queryByTestId } = render(<TxSummary item={mockQueuedWithId} isBulkGroup />)

      await waitFor(() => expect(queryByTestId('safenet-queue-status')).not.toBeInTheDocument())
    })
  })
})
