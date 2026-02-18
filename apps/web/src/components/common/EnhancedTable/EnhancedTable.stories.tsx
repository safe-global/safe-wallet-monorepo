import type { Meta, StoryObj } from '@storybook/react'
import { Button, Typography, Chip } from '@mui/material'
import EnhancedTable, { type EnhancedTableProps } from './index'

const meta: Meta<typeof EnhancedTable> = {
  title: 'Components/Common/EnhancedTable',
  component: EnhancedTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<EnhancedTableProps>

const headCells = [
  { id: 'name', label: 'Name', width: '30%' },
  { id: 'status', label: 'Status', width: '20%' },
  { id: 'amount', label: 'Amount', width: '25%' },
  { id: 'actions', label: '', width: '25%', disableSort: true },
]

const createRows = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    key: `row-${i}`,
    cells: {
      name: { content: <Typography>Transaction #{i + 1}</Typography>, rawValue: `Transaction ${i + 1}` },
      status: {
        content: (
          <Chip label={i % 2 === 0 ? 'Pending' : 'Executed'} color={i % 2 === 0 ? 'warning' : 'success'} size="small" />
        ),
        rawValue: i % 2 === 0 ? 'pending' : 'executed',
      },
      amount: { content: <Typography fontWeight={500}>{(i * 0.5).toFixed(4)} ETH</Typography>, rawValue: i * 0.5 },
      actions: {
        content: (
          <Button variant="outlined" size="small">
            View
          </Button>
        ),
        rawValue: null,
      },
    },
  }))

export const Default: Story = {
  args: { headCells, rows: createRows(5) },
}

export const Empty: Story = {
  args: { headCells, rows: [] },
}

export const WithPagination: Story = {
  args: { headCells, rows: createRows(30) },
}
