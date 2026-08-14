import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
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
        content: <Badge variant={i % 2 === 0 ? 'warning' : 'success'}>{i % 2 === 0 ? 'Pending' : 'Executed'}</Badge>,
        rawValue: i % 2 === 0 ? 'pending' : 'executed',
      },
      amount: {
        content: <Typography variant="paragraph-medium">{(i * 0.5).toFixed(4)} ETH</Typography>,
        rawValue: i * 0.5,
      },
      actions: {
        content: (
          <Button variant="outline" size="sm">
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
