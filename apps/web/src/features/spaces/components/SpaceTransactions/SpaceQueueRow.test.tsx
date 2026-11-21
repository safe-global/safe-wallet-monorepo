import { faker } from '@faker-js/faker'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { fireEvent, mockClipboard, render, screen } from '@/tests/test-utils'
import SpaceQueueRow from './SpaceQueueRow'

jest.mock('./AddToAddressBook', () => ({
  __esModule: true,
  default: ({ address, chainId }: { address: string; chainId: string }) => (
    <button>{`Add ${address} on ${chainId}`}</button>
  ),
}))
jest.mock('./QueueTxDetails', () => ({
  __esModule: true,
  default: { Type: () => null, Summary: () => null },
}))
jest.mock('./RowActionsMenu', () => ({ __esModule: true, default: () => null }))
jest.mock('./SignersTooltip', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/transactions/TxSummary/QueueActions', () => ({ __esModule: true, default: () => null }))
jest.mock('@/features/swap/public/hooks/useIsExpiredSwap', () => ({ __esModule: true, default: () => false }))

const CHAIN_ID = '137'
const RECIPIENT = checksumAddress(faker.finance.ethereumAddress())

const transferTo = (recipient: { value: string; name?: string }): TransactionInfo =>
  ({
    type: 'Transfer',
    direction: 'OUTGOING',
    sender: { value: checksumAddress(faker.finance.ethereumAddress()) },
    recipient,
    transferInfo: { type: 'NATIVE_COIN', value: '1' },
  }) as TransactionInfo

const renderRow = (txInfo: TransactionInfo) => {
  const item: TransactionQueuedItem = {
    type: 'TRANSACTION',
    conflictType: 'None',
    transaction: safeTxSummaryBuilder()
      .with({ txInfo, timestamp: faker.date.past().getTime(), executionInfo: executionInfoBuilder().build() })
      .build(),
  }
  return render(
    <table>
      <tbody>
        <SpaceQueueRow item={item} chainId={CHAIN_ID} status="waiting" />
      </tbody>
    </table>,
  )
}

const addAction = () => screen.queryByRole('button', { name: `Add ${RECIPIENT} on ${CHAIN_ID}` })

describe('SpaceQueueRow', () => {
  it('offers to add an unnamed counterparty to the address book, on the row network', () => {
    renderRow(transferTo({ value: RECIPIENT }))

    expect(addAction()).toBeInTheDocument()
  })

  it('copies the unnamed counterparty address when the address is clicked', () => {
    const writeText = mockClipboard()
    renderRow(transferTo({ value: RECIPIENT }))

    fireEvent.click(screen.getByLabelText('Copy to clipboard'))

    expect(writeText).toHaveBeenCalledWith(RECIPIENT)
  })

  it('does not offer to add a counterparty the gateway already names', () => {
    renderRow(transferTo({ value: RECIPIENT, name: faker.company.name() }))

    expect(addAction()).not.toBeInTheDocument()
  })

  it('does not offer to add a protocol that has no address', () => {
    renderRow({ type: 'SwapOrder' } as TransactionInfo)

    expect(screen.queryByRole('button', { name: /^Add / })).not.toBeInTheDocument()
  })
})
