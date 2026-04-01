import type { Meta, StoryObj } from '@storybook/react'
import FeesPreview from './index'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'

const meta = {
  title: 'Features/GTF/FeesPreview',
  component: FeesPreview,
  tags: ['autodocs'],
} satisfies Meta<typeof FeesPreview>

export default meta
type Story = StoryObj<typeof meta>

const defaultArgs: FeesPreviewData = {
  canCoverFees: true,
  executionFee: {
    label: 'Execution fee (0.05%)',
    amount: '0.02733',
    currency: 'ETH',
    isFree: true,
  },
  gasFee: { label: 'Gas fee', amount: '0.02733', currency: 'ETH', fiatAmount: '$97.30' },
  totalOutgoing: { primary: { amount: '0.60126', currency: 'ETH' }, fiatTotal: '$1,768.85' },
  availableGasTokens: [{ symbol: 'ETH', logoUri: '' }],
  selectedGasToken: 'ETH',
  onGasTokenChange: () => {},
}

export const Default: Story = {
  args: defaultArgs,
}

export const TwoCurrencies: Story = {
  args: {
    ...defaultArgs,
    totalOutgoing: {
      primary: { amount: '0.5466', currency: 'ETH' },
      fees: { amount: '3.50', currency: 'USDC' },
      fiatTotal: '$1,068.00',
    },
  },
}

export const Loading: Story = {
  args: { ...defaultArgs, loading: true },
}

export const Error: Story = {
  args: { ...defaultArgs, error: true },
}
