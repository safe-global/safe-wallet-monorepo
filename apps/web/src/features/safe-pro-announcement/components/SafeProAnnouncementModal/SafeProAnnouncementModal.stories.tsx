import type { Meta, StoryObj } from '@storybook/react'
import SafeProAnnouncementModal from './index'

const meta = {
  component: SafeProAnnouncementModal,
  title: 'Features/SafePro/SafeProAnnouncementModal',
  tags: ['autodocs'],
  args: {
    open: true,
  },
} satisfies Meta<typeof SafeProAnnouncementModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
