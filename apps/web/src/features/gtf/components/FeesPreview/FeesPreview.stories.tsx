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
    label: 'Execution fee',
    isFree: true,
  },
  gasFee: { label: 'Gas fee', amount: '0.02733', currency: 'ETH', fiatAmount: '$97.30' },
  totalOutgoing: { primary: [{ amount: '0.60126', currency: 'ETH' }], fiatTotal: '$1,768.85' },
  availableGasTokens: [{ address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', logoUri: '' }],
  selectedGasToken: '0x0000000000000000000000000000000000000000',
  onGasTokenChange: () => {},
}

export const Default: Story = {
  args: defaultArgs,
}

export const TwoCurrencies: Story = {
  args: {
    ...defaultArgs,
    totalOutgoing: {
      primary: [{ amount: '0.5466', currency: 'ETH' }],
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

export const FallbackEOA: Story = {
  args: {
    canCoverFees: false,
    executionFee: { label: 'Execution fee', isFree: true },
    gasFee: { label: 'Gas fee', amount: '0.02733', currency: 'ETH', fiatAmount: '$97.30' },
    totalOutgoing: { primary: [{ amount: '0.60126', currency: 'ETH' }], fiatTotal: '$1,768.95' },
    availableGasTokens: [{ address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', logoUri: '' }],
    selectedGasToken: '0x0000000000000000000000000000000000000000',
  },
}

export const Confirmation: Story = {
  args: {
    ...defaultArgs,
    isConfirmation: true,
  },
}

export const ConfirmationTwoCurrencies: Story = {
  args: {
    ...defaultArgs,
    isConfirmation: true,
    totalOutgoing: {
      primary: [{ amount: '0.5466', currency: 'ETH' }],
      fees: { amount: '3.50', currency: 'USDC' },
      fiatTotal: '$1,068.00',
    },
  },
}

export const FallbackEOATwoCurrencies: Story = {
  args: {
    canCoverFees: false,
    executionFee: { label: 'Execution fee', isFree: true },
    gasFee: { label: 'Gas fee', amount: '0.02733', currency: 'ETH', fiatAmount: '$97.30' },
    totalOutgoing: {
      primary: [{ amount: '0.5466', currency: 'ETH' }],
      fees: { amount: '3.50', currency: 'USDC' },
      fiatTotal: '$1,068.00',
    },
    availableGasTokens: [{ address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', logoUri: '' }],
    selectedGasToken: '0x0000000000000000000000000000000000000000',
  },
}

export const FallbackNoGtfAmount: Story = {
  args: {
    canCoverFees: false,
    executionFee: { label: 'Execution fee', isFree: true },
    gasFee: { label: 'Gas fee', amount: '3.50', currency: 'ETH', fiatAmount: '$3.50' },
  },
}
