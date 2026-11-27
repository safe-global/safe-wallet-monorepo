import type { Meta, StoryObj } from '@storybook/react'
import { WhatsNewCornerCardContent } from './WhatsNewCornerCard'

const meta = {
  title: 'Features/Spaces/WhatsNewCornerCard',
  component: WhatsNewCornerCardContent,
  args: {
    cornerCard: {
      postId: 1,
      title: 'Safenet checks now available in Safe Pro',
      body: 'Independent security checks on every transaction, before it executes. Safenet runs each transaction past',
    },
    onOpen: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof WhatsNewCornerCardContent>

export default meta
type Story = StoryObj<typeof meta>

export const TextOnly: Story = {}

export const TitleOnly: Story = {
  args: {
    cornerCard: { postId: 2, title: 'Safenet checks now available in Safe Pro' },
  },
}
