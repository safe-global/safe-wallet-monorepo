import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import { MigrateToL2Information } from './index'

const meta = {
  title: 'Components/TxFlow/ConfirmationViews/MigrateToL2Information',
  component: MigrateToL2Information,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <div className="rounded-lg bg-background p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
  // Skip visual regression tests until baseline snapshots are generated
  tags: ['autodocs', '!test'],
} satisfies Meta<typeof MigrateToL2Information>

export default meta
type Story = StoryObj<typeof meta>

export const History: Story = {
  args: {
    variant: 'history',
  },
}

export const Queue: Story = {
  args: {
    variant: 'queue',
  },
}
