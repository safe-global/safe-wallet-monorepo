import type { Meta, StoryObj } from '@storybook/react'
import { TxSafeAppCard } from '@/src/components/transactions-list/Card/TxSafeAppCard'
import { mockTransferWithInfo } from '@/src/tests/mocks'
import { MultiSend } from '@safe-global/store/gateway/types'

const meta: Meta<typeof TxSafeAppCard> = {
  title: 'TransactionsList/TxSafeAppCard',
  component: TxSafeAppCard,
  argTypes: {
    bordered: {
      description: 'Define if you want a border on the transaction',
      control: {
        type: 'boolean',
      },
    },
  },
  args: {
    bordered: false,
    safeAppInfo: {
      id: 29,
      name: 'Transaction Builder',
      url: 'http://something.com',
      logoUri: 'https://safe-transaction-assets.safe.global/safe_apps/29/icon.png',
    },
    txInfo: mockTransferWithInfo({}) as MultiSend,
  },
}

export default meta

type Story = StoryObj<typeof TxSafeAppCard>

export const Default: Story = {}
