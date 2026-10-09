import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import GasTooHighBanner from './index'

// Informational banner shown in the transaction flow when gas prices exceed
// the sponsoring threshold of the no-fee campaign.
const meta = {
  title: 'Features/NoFeeCampaign/GasTooHighBanner',
  component: GasTooHighBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof GasTooHighBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
