import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import { WhatsNewDrawer } from './WhatsNewDrawer'

const meta = {
  title: 'Features/Spaces/WhatsNewDrawer',
  component: WhatsNewDrawer,
  decorators: [withMockProvider({ shadcn: true })],
  tags: ['skip-visual-test'],
  args: {
    productId: 'storybook',
    open: true,
    onClose: () => {},
  },
} satisfies Meta<typeof WhatsNewDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
