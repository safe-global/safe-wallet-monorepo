import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import SafeProAnnouncement from './index'

const meta = {
  component: SafeProAnnouncement,
  title: 'Features/SafePro/SafeProAnnouncement',
  tags: ['autodocs'],
  decorators: [withMockProvider({ shadcn: true })],
} satisfies Meta<typeof SafeProAnnouncement>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
