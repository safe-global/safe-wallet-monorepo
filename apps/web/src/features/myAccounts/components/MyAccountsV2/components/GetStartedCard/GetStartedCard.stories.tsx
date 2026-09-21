import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import GetStartedCard from '.'

const meta = {
  title: 'MyAccounts/GetStartedCard',
  component: GetStartedCard,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof GetStartedCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
