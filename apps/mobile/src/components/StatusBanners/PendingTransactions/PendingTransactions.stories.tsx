import type { Meta, StoryObj } from '@storybook/react'
import { PendingTransactions } from '@/src/components/StatusBanners/PendingTransactions'
import { action } from 'storybook/actions'

const meta: Meta<typeof PendingTransactions> = {
  title: 'StatusBanners/PendingTransactions',
  component: PendingTransactions,
  argTypes: {
    number: { control: 'number' },
  },
  parameters: { actions: { argTypesRegex: '^on.*' } },
  args: {
    fullWidth: false,
    number: '5',
    onPress: action('on-press'),
  },
}

export default meta

type Story = StoryObj<typeof PendingTransactions>

export const Default: Story = {}
