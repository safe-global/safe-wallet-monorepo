import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { MigrateToL2Information } from './index'

const meta = {
  component: MigrateToL2Information,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
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
