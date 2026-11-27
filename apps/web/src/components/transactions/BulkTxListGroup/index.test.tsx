import { faker } from '@faker-js/faker'
import type {
  Erc20Transfer,
  MultisigTransaction,
  SwapTransferTransactionInfo,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  ConflictType,
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/store/gateway/types'

import BulkTxListGroup from '@/components/transactions/BulkTxListGroup'
import { render, screen } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'

const TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000abc'

const createTx = (nonce: number, id: string): MultisigTransaction => ({
  type: TransactionListItemType.TRANSACTION,
  transaction: {
    id,
    txHash: TX_HASH,
    timestamp: Date.now(),
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce,
      confirmationsRequired: 1,
      confirmationsSubmitted: 1,
      missingSigners: [],
    },
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      direction: TransferDirection.OUTGOING,
      transferInfo: {
        value: '1000000',
        type: TransactionTokenType.NATIVE_COIN,
      },
    },
    txStatus: TransactionStatus.SUCCESS,
  } as unknown as Transaction,
  conflictType: ConflictType.NONE,
})

const token = () => ({
  address: faker.finance.ethereumAddress(),
  decimals: 18,
  logoUri: faker.image.url(),
  name: faker.finance.currencyName(),
  symbol: faker.finance.currencyCode(),
  trusted: true,
})

const swapTransfer = (orderClass?: string): SwapTransferTransactionInfo => ({
  type: 'SwapTransfer',
  sender: { value: faker.finance.ethereumAddress() },
  recipient: { value: faker.finance.ethereumAddress() },
  direction: TransferDirection.OUTGOING,
  transferInfo: { type: TransactionTokenType.NATIVE_COIN, value: '1000000' },
  uid: faker.string.hexadecimal({ length: 112 }),
  status: 'fulfilled',
  kind: 'sell',
  orderClass: 'market',
  validUntil: faker.date.future().getTime(),
  sellAmount: '10000000000000000000',
  buyAmount: '363198460147836860990',
  executedSellAmount: '10000000000000000000',
  executedBuyAmount: '363198460147836860990',
  sellToken: token(),
  buyToken: token(),
  explorerUrl: faker.internet.url(),
  executedFee: '0',
  executedFeeToken: token(),
  owner: faker.finance.ethereumAddress(),
  fullAppData: orderClass ? { metadata: { orderClass: { orderClass } } } : null,
})

const withTxInfo = (tx: MultisigTransaction, txInfo: SwapTransferTransactionInfo): MultisigTransaction => ({
  ...tx,
  transaction: { ...tx.transaction, txInfo },
})

describe('BulkTxListGroup', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('titles a group of transactions as bulk transactions and counts them', async () => {
    render(
      <BulkTxListGroup groupedListItems={[createTx(11, 'tx-1'), createTx(12, 'tx-2')]} transactionHash={TX_HASH} />,
    )

    expect(await screen.findByText('Bulk transactions')).toBeInTheDocument()
    expect(screen.getByText('2 transactions')).toBeInTheDocument()
  })

  it.each([
    ['limit', 'Limit order settlement'],
    ['twap', 'TWAP order settlement'],
    ['liquidity', 'Liquidity order settlement'],
    ['market', 'Swap order settlement'],
    [undefined, 'Swap order settlement'],
  ])('titles a settlement of a %s order as "%s"', async (orderClass, title) => {
    const items = [
      withTxInfo(createTx(11, 'tx-1'), swapTransfer(orderClass)),
      withTxInfo(createTx(12, 'tx-2'), swapTransfer(orderClass)),
    ]

    render(<BulkTxListGroup groupedListItems={items} transactionHash={TX_HASH} />)

    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(screen.getByText('2 transactions')).toBeInTheDocument()
    expect(screen.queryByText('Bulk transactions')).not.toBeInTheDocument()
  })

  it('lists the sent and the received amount of a settlement', async () => {
    const erc20 = (tokenSymbol: string, value: string): Erc20Transfer => ({
      type: 'ERC20',
      tokenAddress: faker.finance.ethereumAddress(),
      tokenSymbol,
      decimals: 18,
      value,
      imitation: false,
    })
    const sent = {
      ...swapTransfer('market'),
      direction: TransferDirection.OUTGOING,
      transferInfo: erc20('COW', '10000000000000000000'),
    }
    const received = {
      ...swapTransfer('market'),
      direction: TransferDirection.INCOMING,
      transferInfo: erc20('DAI', '363198460147836860990'),
    }

    render(
      <BulkTxListGroup
        groupedListItems={[withTxInfo(createTx(11, 'tx-1'), sent), withTxInfo(createTx(12, 'tx-2'), received)]}
        transactionHash={TX_HASH}
      />,
    )

    expect(await screen.findByText('-10 COW')).toBeInTheDocument()
    expect(screen.getByText('363.19846 DAI')).toBeInTheDocument()
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(screen.getByText('Received')).toBeInTheDocument()
  })

  it('links the shared transaction hash to the block explorer of the chain', async () => {
    const chain = chainBuilder()
      .with({
        blockExplorerUriTemplate: {
          address: 'https://sepolia.etherscan.io/address/{{address}}',
          txHash: 'https://sepolia.etherscan.io/tx/{{txHash}}',
          api: 'https://api-sepolia.etherscan.io/api',
        },
      })
      .build()
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chain)

    render(<BulkTxListGroup groupedListItems={[createTx(11, 'tx-1')]} transactionHash={TX_HASH} />)

    expect(await screen.findByTestId('explorer-btn')).toHaveAttribute(
      'href',
      `https://sepolia.etherscan.io/tx/${TX_HASH}`,
    )
  })

  it('renders a nonce inside every transaction row of the group', () => {
    const { getAllByTestId } = render(
      <BulkTxListGroup groupedListItems={[createTx(11, 'tx-1'), createTx(12, 'tx-2')]} transactionHash={TX_HASH} />,
    )

    expect(getAllByTestId('nonce').map((el) => el.textContent)).toEqual(['11', '12'])
  })

  it('renders the nonce within the row, not beside it', () => {
    const { getAllByTestId, getByTestId } = render(
      <BulkTxListGroup groupedListItems={[createTx(11, 'tx-1')]} transactionHash={TX_HASH} />,
    )

    expect(getByTestId('transaction-item')).toContainElement(getAllByTestId('nonce')[0])
  })

  it('renders no nonce when a transaction has no multisig execution info', () => {
    const tx = createTx(11, 'tx-1')
    const withoutExecutionInfo = {
      ...tx,
      transaction: { ...tx.transaction, executionInfo: undefined },
    } as MultisigTransaction

    const { queryByTestId } = render(
      <BulkTxListGroup groupedListItems={[withoutExecutionInfo]} transactionHash={TX_HASH} />,
    )

    expect(queryByTestId('nonce')).not.toBeInTheDocument()
  })

  it('renders nothing when the group is empty', () => {
    const { container } = render(<BulkTxListGroup groupedListItems={[]} transactionHash={TX_HASH} />)

    expect(container).toBeEmptyDOMElement()
  })
})
