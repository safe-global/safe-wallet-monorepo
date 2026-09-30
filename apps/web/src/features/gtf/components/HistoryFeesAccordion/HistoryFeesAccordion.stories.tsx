import type { Meta, StoryObj } from '@storybook/react'
import HistoryFeesAccordion from './index'
import type { HistoryFeesData } from '../../hooks/useHistoryFeesBreakdown'

const meta = {
  title: 'Features/GTF/HistoryFeesAccordion',
  component: HistoryFeesAccordion,
  tags: ['autodocs'],
} satisfies Meta<typeof HistoryFeesAccordion>

export default meta
type Story = StoryObj<typeof meta>

const defaultData: HistoryFeesData = {
  totalFee: { amount: '0.005', currency: 'ETH', fiatAmount: '$15.12' },
  executionFee: { label: 'Execution fee (0.5%)', amount: '0.002730', currency: 'ETH', isFree: true },
  gasFee: { label: 'Gas fee', amount: '0.005', currency: 'ETH', fiatAmount: '$15.12' },
  paidFrom: 'signer',
}

export const Collapsed: Story = {
  args: { data: defaultData },
}

export const FreeExecutionFee: Story = {
  args: { data: defaultData },
  parameters: {
    docs: { description: { story: 'Execution fee shown as FREE with strikethrough on the original amount.' } },
  },
}

export const PaidExecutionFee: Story = {
  args: {
    data: {
      ...defaultData,
      executionFee: {
        label: 'Execution fee (0.5%)',
        amount: '0.002730',
        currency: 'ETH',
        fiatAmount: '$2.00',
        isFree: false,
      },
    },
  },
}

export const NonNativeGasToken: Story = {
  args: {
    data: {
      totalFee: { amount: '3.50', currency: 'USDC', fiatAmount: '$3.50' },
      executionFee: { label: 'Execution fee (0.5%)', amount: '0.50', currency: 'USDC', isFree: true },
      gasFee: { label: 'Gas fee', amount: '3.50', currency: 'USDC', fiatAmount: '$3.50' },
      paidFrom: 'safe',
    },
  },
}

export const NoFiat: Story = {
  args: {
    data: {
      totalFee: { amount: '0.005', currency: 'ETH' },
      executionFee: { label: 'Execution fee (0.5%)', amount: '0.002730', currency: 'ETH', isFree: true },
      gasFee: { label: 'Gas fee', amount: '0.005', currency: 'ETH' },
      paidFrom: 'signer',
    },
  },
}
