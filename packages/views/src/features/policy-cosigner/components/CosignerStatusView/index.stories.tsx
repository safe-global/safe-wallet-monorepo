import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import CosignerStatusView from './index'

const meta = {
  title: 'Features/PolicyCosigner/CosignerStatusView',
  component: CosignerStatusView,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof CosignerStatusView>

export default meta
type Story = StoryObj<typeof meta>

export const Waiting: Story = {
  args: {
    tone: 'info',
    title: 'Co-signature',
    message: 'Waiting for the co-signer to review this transaction.',
    loading: true,
  },
}

export const Signed: Story = {
  args: {
    tone: 'success',
    title: 'Co-signature',
    message: 'The co-signer approved this transaction.',
  },
}

export const Rejected: Story = {
  args: {
    tone: 'destructive',
    title: 'Co-signature',
    message: 'The co-signer rejected this transaction: transfer exceeds the per-transfer limit',
  },
}

export const UnsupportedBatch: Story = {
  args: {
    tone: 'warning',
    title: 'Co-signature',
    message:
      'This batch needs a co-signature for each action, which is not supported yet. Execute the actions separately.',
  },
}
