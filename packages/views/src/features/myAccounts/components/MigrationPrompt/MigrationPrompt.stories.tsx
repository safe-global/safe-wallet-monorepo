import type { Meta, StoryObj } from '@storybook/react'
import MigrationPrompt from './index'

const meta = {
  title: 'Features/MyAccounts/MigrationPrompt',
  component: MigrationPrompt,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MigrationPrompt>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onProceed: () => alert('Proceed clicked'),
  },
}
