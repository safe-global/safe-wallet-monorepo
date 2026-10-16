import type { Meta, StoryObj } from '@storybook/react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TX_HISTORY_SAFE, transactionFixtures } from '@safe-global/test/msw/fixtures'
import { createTransactionHandlersFromFixture } from '@safe-global/test/msw/handlers/fromFixtures'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
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

const expandedOf = (txDetails: TransactionDetails): Story => ({
  args: { item: findHistoryItem(txDetails.txId), txDetails },
})

const { details } = transactionFixtures

export const OnChainRejection = summaryOf(details.onChainRejection)
export const OnChainRejectionExpanded = expandedOf(details.onChainRejection)

export const Batch = summaryOf(details.batch)
export const BatchExpanded = expandedOf(details.batch)

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
