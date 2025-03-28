import type { Meta, StoryObj } from '@storybook/react'
import { TxOrderCard } from './TxOrderCard'
import { mockSwapTransfer } from '@/src/tests/mocks'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'

const meta: Meta<typeof TxOrderCard> = {
  title: 'TransactionsList/TxSwapCard',
  component: TxOrderCard,
  args: {
    txInfo: mockSwapTransfer as OrderTransactionInfo,
  },
}

export default meta

type Story = StoryObj<typeof TxOrderCard>

export const Default: Story = {}
