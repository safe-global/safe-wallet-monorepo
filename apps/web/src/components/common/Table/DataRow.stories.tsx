import type { Meta, StoryObj } from '@storybook/react'
import { DataRow } from './DataRow'
import { Paper } from '@mui/material'

const meta = {
  component: DataRow,
  parameters: {
    componentSubtitle: 'A simple label<=>value pair row for a table',
  },
  argTypes: {
    title: {
      description: 'The label for the data row',
      table: {
        type: { summary: 'ReactNode' },
        defaultValue: { summary: 'undefined' },
      },
      control: {
        type: 'text',
      },
    },
    children: {
      description: 'Value for the row. It can be a ReactNode or a string.',
      table: {
        type: { summary: 'ReactNode | String' },
        defaultValue: { summary: 'undefined' },
      },
      control: {
        type: 'text',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataRow>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Data Row component is used mainly at places where we need to display
 * transaction data. It is a simple label<=>value pair row for a table. On small displays
 * label<=>value shifts to
 * label
 * value
 */
export const StringValue: Story = {
  args: {
    title: 'Transaction Hash',
    children: '0x536e...94f9',
  },
  decorators: [
    (Story) => (
      <Paper sx={{ padding: 2 }}>
        <Story />
      </Paper>
    ),
  ],
}
