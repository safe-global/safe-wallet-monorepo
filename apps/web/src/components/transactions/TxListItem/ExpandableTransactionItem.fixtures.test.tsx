import type { TransactionDetails, TransactionItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TX_HISTORY_SAFE, transactionFixtures } from '@safe-global/test/msw/fixtures'
import { createTransactionHandlersFromFixture } from '@safe-global/test/msw/handlers/fromFixtures'
import { userEvent } from '@testing-library/user-event'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { server } from '@/tests/server'
import { render, screen, waitFor } from '@/tests/test-utils'
import { isTransactionListItem } from '@/utils/transaction-guards'
import ExpandableTransactionItem from './ExpandableTransactionItem'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const STATUS_SUCCESS = 'Success'
const REQUIRED_CONFIRMATIONS_TITLE = 'Required confirmations for new transactions'

const { details } = transactionFixtures

type HistoryRow = {
  name: string
  details: TransactionDetails
  summary: string[]
  expanded: string[]
}

const HISTORY_ROWS: HistoryRow[] = [
  {
    name: 'on-chain rejection',
    details: details.onChainRejection,
    summary: ['On-chain rejection', STATUS_SUCCESS],
    expanded: [
      "This is an on-chain rejection that didn't send any funds. This on-chain rejection replaced all transactions with nonce 16.",
      'Created',
      'Signed (1/2)',
      'Signed (2/2)',
      'Executed',
    ],
  },
  {
    name: 'batch',
    details: details.batch,
    summary: ['Batch', '2 actions', STATUS_SUCCESS],
    expanded: ['Safe: MultiSendCallOnly 1.3.0'],
  },
  {
    name: 'add owner',
    details: details.addOwner,
    summary: ['addOwnerWithThreshold', STATUS_SUCCESS],
    expanded: ['Add signer', REQUIRED_CONFIRMATIONS_TITLE, '0x4fe7164d7cA511Ab35520bb14065F1693240dC90'],
  },
  {
    name: 'swap owner',
    details: details.swapOwner,
    summary: ['swapOwner', STATUS_SUCCESS],
    expanded: [
      'Swap signer',
      'New signer',
      '0x8a39cE4E27C326B87B75AaFf820D442311CD8E4E',
      'Old signer',
      '0x01A9F68e339da12565cfBc47fe7D6EdEcB11C46f',
    ],
  },
  {
    name: 'remove owner',
    details: details.removeOwner,
    summary: ['removeOwner', STATUS_SUCCESS],
    expanded: ['Remove signer', REQUIRED_CONFIRMATIONS_TITLE, '0x8a39cE4E27C326B87B75AaFf820D442311CD8E4E'],
  },
  {
    name: 'disable module',
    details: details.disableModule,
    summary: ['disableModule', STATUS_SUCCESS],
    expanded: ['Disable module', '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134'],
  },
  {
    name: 'change threshold',
    details: details.changeThreshold,
    summary: ['changeThreshold', STATUS_SUCCESS],
    expanded: [REQUIRED_CONFIRMATIONS_TITLE],
  },
]

const SENDER = '0x96D4c6fFC338912322813a77655fCC926b9A5aC5'
const SAFE_PREFIX = TX_HISTORY_SAFE.address
const SEND_ETH_ID = `multisig_${SAFE_PREFIX}_0xcfbe040521dd80d43f408c7fd3ce7d80f21e8916a04a56ff0fe5cd14eb1a508f`
const DELETE_ALLOWANCE_ID = `multisig_${SAFE_PREFIX}_0x4380e4deadbd29fb0d098bdfe80572bc22985586e0b400732af8371a5595b84c`
const RECEIVE_UNTRUSTED_ID = `transfer_${SAFE_PREFIX}_e54e7e766b08d4210bc1cfcc84d84ca4782a0cc1efe9e7d9c032d305060ed2a7c3044`

const SUMMARY_ROWS = [
  { name: 'token receipt', txId: details.receiveQtrust.txId, summary: ['Received', '1,000 QTRUST', STATUS_SUCCESS] },
  { name: 'native transfer', txId: SEND_ETH_ID, summary: ['Sent', '-0.0001 ETH', STATUS_SUCCESS] },
  {
    name: 'allowance deletion',
    txId: DELETE_ALLOWANCE_ID,
    summary: ['AllowanceModule', 'deleteAllowance', STATUS_SUCCESS],
  },
]

const historyItems = transactionFixtures.history.results.filter(isTransactionListItem)

const findHistoryItem = (txId: string): TransactionItem => {
  const item = historyItems.find(({ transaction }) => transaction.id === txId)
  if (!item) {
    throw new Error(`No row with id ${txId} in the history fixture. Re-run fetch-fixtures.ts --group=transactions`)
  }
  return item
}

const historySafe = extendedSafeInfoBuilder()
  .with({
    address: { value: TX_HISTORY_SAFE.address },
    chainId: TX_HISTORY_SAFE.chainId,
    version: TX_HISTORY_SAFE.version,
  })
  .build()

const sepolia = chainBuilder()
  .with({
    chainId: TX_HISTORY_SAFE.chainId,
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
  })
  .build()

const renderHistoryItem = (item: TransactionItem, txDetails?: TransactionDetails) =>
  render(<ExpandableTransactionItem item={item} txDetails={txDetails} />, {
    routerProps: {
      pathname: AppRoutes.transactions.history,
      query: { safe: `${TX_HISTORY_SAFE.shortName}:${TX_HISTORY_SAFE.address}` },
    },
    initialReduxState: { safeInfo: { data: historySafe, loading: false, loaded: true } },
  })

const renderCollapsedRow = (txId: string) => renderHistoryItem(findHistoryItem(txId))

const renderExpandedRow = (txDetails: TransactionDetails) =>
  renderHistoryItem(findHistoryItem(txDetails.txId), txDetails)

const findLoadedDetails = async () => {
  await screen.findByTestId('transaction-actions-list')
  return screen.getByTestId('accordion-details')
}

describe('ExpandableTransactionItem with the recorded staging history', () => {
  beforeEach(() => {
    server.use(...createTransactionHandlersFromFixture(GATEWAY_URL))
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(sepolia)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each(HISTORY_ROWS)('shows the $name summary', async ({ details: txDetails, summary }) => {
    renderCollapsedRow(txDetails.txId)

    const row = await screen.findByTestId('transaction-item')
    summary.forEach((text) => expect(row).toHaveTextContent(text))
  })

  it.each(SUMMARY_ROWS)('shows the $name summary', async ({ txId, summary }) => {
    renderCollapsedRow(txId)

    const row = await screen.findByTestId('transaction-item')
    summary.forEach((text) => expect(row).toHaveTextContent(text))
  })

  it('shows the sender and amount of a token receipt when expanded', async () => {
    renderExpandedRow(details.receiveQtrust)

    const loadedDetails = await screen.findByTestId('accordion-details')
    await waitFor(() => expect(loadedDetails).toHaveTextContent(SENDER))
    expect(loadedDetails).toHaveTextContent('Receive')
    expect(loadedDetails).toHaveTextContent('1,000 QTRUST')
  })

  it('warns about an untrusted token receipt on a chain with the default token list', async () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => feature === FEATURES.DEFAULT_TOKENLIST)

    renderCollapsedRow(RECEIVE_UNTRUSTED_ID)

    const row = await screen.findByTestId('transaction-item')
    expect(row).toHaveTextContent('5 TTONE')
    expect(row).toHaveTextContent(STATUS_SUCCESS)
    expect(screen.getByTestId('warning')).toBeInTheDocument()
  })

  it.each(HISTORY_ROWS)('shows the $name details when expanded', async ({ details: txDetails, expanded }) => {
    renderExpandedRow(txDetails)

    const loadedDetails = await findLoadedDetails()
    expanded.forEach((text) => expect(loadedDetails).toHaveTextContent(text))
  })

  it.each([details.addOwner, details.removeOwner, details.changeThreshold])(
    'warns about the confirmation policy change of $txInfo.settingsInfo.type',
    async (txDetails) => {
      renderExpandedRow(txDetails)

      expect(await screen.findByTestId('threshold-warning')).toBeInTheDocument()
    },
  )

  it.each([
    { txDetails: details.removeOwner, threshold: '1' },
    { txDetails: details.changeThreshold, threshold: '2' },
  ])(
    'shows $threshold required confirmations after $txDetails.txInfo.settingsInfo.type',
    async ({ txDetails, threshold }) => {
      renderExpandedRow(txDetails)

      expect(await screen.findByTestId('required-confirmations')).toHaveTextContent(threshold)
    },
  )

  it('warns about the delegate call of a batch and lists its 2 actions', async () => {
    renderExpandedRow(details.batch)

    expect(await screen.findByTestId('delegate-call-warning')).toBeInTheDocument()
    expect(screen.getByTestId('all-actions')).toBeInTheDocument()
    expect(screen.getAllByTestId('action-item')).toHaveLength(2)
  })

  it('groups the domain, message and safeTx hashes in the transaction details', async () => {
    renderExpandedRow(details.disableModule)

    await userEvent.click(await screen.findByTestId('tx-advanced-details'))
    await userEvent.click(screen.getByText('Hashes'))

    expect(screen.getByText('Domain hash')).toBeInTheDocument()
    expect(screen.getByText('Message hash')).toBeInTheDocument()
    expect(screen.getByText('safeTxHash')).toBeInTheDocument()
  })
})
