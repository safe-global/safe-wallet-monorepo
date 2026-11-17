import type { Meta, StoryObj } from '@storybook/react'
import HistoryFeesAccordion from './index'
import type { HistoryFeesData } from '@/features/fee-payment/hooks/useHistoryFeesBreakdown'

const meta = {
  title: 'Features/FeePayment/HistoryFeesAccordion',
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

export const Sponsored: Story = {
  args: {
    data: {
      totalFee: { amount: '0.0000000777', currency: 'ETH', fiatAmount: '$0.03' },
      executionFee: { label: 'Execution fee', isFree: true },
      gasFee: { label: 'Max gas fee', amount: '0.0000000777', currency: 'ETH', fiatAmount: '$0.03', isFree: true },
      paidFrom: 'sponsored',
    },
  },
  parameters: {
    docs: { description: { story: 'Sponsored: what the transaction would have cost, struck through.' } },
  },
}

export const AllPayers: Story = {
  args: { data: defaultData },
  render: () => (
    <div className="flex flex-col gap-4">
      <HistoryFeesAccordion
        data={{
          totalFee: { amount: '3.50', currency: 'USDC', fiatAmount: '$3.50' },
          executionFee: { label: 'Execution fee', isFree: true },
          gasFee: { label: 'Max gas fee', amount: '3.50', currency: 'USDC', fiatAmount: '$3.50' },
          paidFrom: 'safe',
        }}
      />
      <HistoryFeesAccordion
        data={{
          totalFee: { amount: '0.00001', currency: 'ETH', fiatAmount: '$0.03' },
          executionFee: { label: 'Execution fee', isFree: true },
          gasFee: { label: 'Max gas fee', amount: '0.00001', currency: 'ETH', fiatAmount: '$0.03' },
          paidFrom: 'signer',
        }}
      />
      <HistoryFeesAccordion
        data={{
          totalFee: { amount: '0.00001', currency: 'ETH', fiatAmount: '$0.03' },
          executionFee: { label: 'Execution fee', isFree: true },
          gasFee: { label: 'Max gas fee', amount: '0.00001', currency: 'ETH', fiatAmount: '$0.03', isFree: true },
          paidFrom: 'sponsored',
        }}
      />
    </div>
  ),
}
