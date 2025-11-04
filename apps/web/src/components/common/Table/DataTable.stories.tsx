import type { Meta, StoryObj } from '@storybook/react'
import { DataTable } from './DataTable'
import { Paper } from '@mui/material'
import { DataRow } from '@/components/common/Table/DataRow'

const meta = {
  component: DataTable,
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The Data Table component renders a header and a list of DataRow components.
 */
export const Default: Story = {
  args: {
    header: 'Simple Data Table',
    rows: [
      <DataRow key="1" title="Transaction Hash">
        0x536e...94f9
      </DataRow>,
      <DataRow key="2" title="Block Number">
        123456
      </DataRow>,
      <DataRow key="3" title="Gas Used">
        21000
      </DataRow>,
    ],
  },
  decorators: [
    (Story) => (
      <Paper sx={{ padding: 2 }}>
        <Story />
      </Paper>
    ),
  ],
}
