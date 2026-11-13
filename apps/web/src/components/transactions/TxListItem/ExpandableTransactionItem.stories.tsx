import type { Meta, StoryObj } from '@storybook/react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TX_HISTORY_SAFE, transactionFixtures } from '@safe-global/test/msw/fixtures'
import { createTransactionHandlersFromFixture } from '@safe-global/test/msw/handlers/fromFixtures'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { userEvent, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { isTransactionListItem } from '@/utils/transaction-guards'
import ExpandableTransactionItem from './ExpandableTransactionItem'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'paper',
  pathname: AppRoutes.transactions.history,
  query: { safe: `${TX_HISTORY_SAFE.shortName}:${TX_HISTORY_SAFE.address}` },
  store: {
    safeInfo: {
      data: {
        address: { value: TX_HISTORY_SAFE.address },
        chainId: TX_HISTORY_SAFE.chainId,
        version: TX_HISTORY_SAFE.version,
      },
    },
  },
})

const meta = {
  title: 'Components/Transactions/ExpandableTransactionItem',
  component: ExpandableTransactionItem,
  parameters: {
    ...setup.parameters,
    msw: { handlers: [...createTransactionHandlersFromFixture(GATEWAY_URL), ...setup.handlers] },
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof ExpandableTransactionItem>

export default meta
type Story = StoryObj<typeof meta>

const historyItems = transactionFixtures.history.results.filter(isTransactionListItem)

const findHistoryItem = (txId: string) => {
  const item = historyItems.find(({ transaction }) => transaction.id === txId)
  if (!item) {
    throw new Error(`No row with id ${txId} in the history fixture. Re-run fetch-fixtures.ts --group=transactions`)
  }
  return item
}

const summaryOf = (txDetails: TransactionDetails): Story => ({ args: { item: findHistoryItem(txDetails.txId) } })

/** A history row that has no recorded details */
const summaryById = (txId: string): Story => ({ args: { item: findHistoryItem(txId) } })

const expandedOf = (txDetails: TransactionDetails): Story => ({
  args: { item: findHistoryItem(txDetails.txId), txDetails },
})

const { details } = transactionFixtures

const SEND_ETH_ID = `multisig_${TX_HISTORY_SAFE.address}_0xcfbe040521dd80d43f408c7fd3ce7d80f21e8916a04a56ff0fe5cd14eb1a508f`
const DELETE_ALLOWANCE_ID = `multisig_${TX_HISTORY_SAFE.address}_0x4380e4deadbd29fb0d098bdfe80572bc22985586e0b400732af8371a5595b84c`
const RECEIVE_UNTRUSTED_ID = `transfer_${TX_HISTORY_SAFE.address}_e54e7e766b08d4210bc1cfcc84d84ca4782a0cc1efe9e7d9c032d305060ed2a7c3044`

export const ReceiveToken = summaryOf(details.receiveQtrust)
export const ReceiveTokenExpanded = expandedOf(details.receiveQtrust)

/** The chain has the default token list, so the untrusted token shows the warning */
export const ReceiveUntrustedToken = summaryById(RECEIVE_UNTRUSTED_ID)

export const SendNativeToken = summaryById(SEND_ETH_ID)

export const DeleteAllowance = summaryById(DELETE_ALLOWANCE_ID)

export const OnChainRejection = summaryOf(details.onChainRejection)
export const OnChainRejectionExpanded = expandedOf(details.onChainRejection)

export const Batch = summaryOf(details.batch)
export const BatchExpanded = expandedOf(details.batch)

export const BatchActionsExpanded: Story = {
  ...expandedOf(details.batch),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTestId('expande-all-btn'))
  },
}

export const AddOwner = summaryOf(details.addOwner)
export const AddOwnerExpanded = expandedOf(details.addOwner)

export const SwapOwner = summaryOf(details.swapOwner)
export const SwapOwnerExpanded = expandedOf(details.swapOwner)

export const RemoveOwner = summaryOf(details.removeOwner)
export const RemoveOwnerExpanded = expandedOf(details.removeOwner)

export const DisableModule = summaryOf(details.disableModule)
export const DisableModuleExpanded = expandedOf(details.disableModule)

export const ChangeThreshold = summaryOf(details.changeThreshold)
export const ChangeThresholdExpanded = expandedOf(details.changeThreshold)
