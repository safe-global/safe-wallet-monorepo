import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import SafeProAnnouncementModal from './index'

const meta = {
  component: SafeProAnnouncementModal,
  title: 'Features/SafePro/SafeProAnnouncementModal',
  tags: ['autodocs'],
  decorators: [withMockProvider({ shadcn: true })],
  args: {
    open: true,
  },
} satisfies Meta<typeof SafeProAnnouncementModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
