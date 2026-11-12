import type { Meta, StoryObj } from '@storybook/react'
import { UsersRound } from 'lucide-react'
import { Button } from '../../primitives/button/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../primitives/empty/empty'
import { Skeleton } from '../../primitives/skeleton/skeleton'
import { DataTable, DataTableCard, type DataTableColumn } from './data-table'

type Row = {
  id: string
  name: string
  role: string
  safes: number
  added: string
}

const ROWS: Row[] = [
  { id: '1', name: 'Test Spaces creator', role: 'Admin', safes: 3, added: '2026-01-05' },
  { id: '2', name: 'Account 3', role: 'Admin', safes: 1, added: '2026-01-12' },
  { id: '3', name: 'Vitalik', role: 'Member', safes: 8, added: '2026-01-20' },
  { id: '4', name: 'test.eth', role: 'Member', safes: 2, added: '2026-02-01' },
  { id: '5', name: 'Treasury', role: 'Member', safes: 5, added: '2026-02-14' },
]

const manyRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `Member ${i + 1}`,
    role: i % 3 === 0 ? 'Admin' : 'Member',
    safes: (i * 7) % 11,
    added: `2026-0${(i % 9) + 1}-1${i % 9}`,
  }))

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: (r) => r.name, emphasis: 'strong', sortValue: (r) => r.name, sticky: true },
  { id: 'role', header: 'Role', cell: (r) => r.role, sortValue: (r) => r.role, priority: 'secondary' },
  { id: 'safes', header: 'Safe accounts', cell: (r) => r.safes, align: 'center', sortValue: (r) => r.safes },
  {
    id: 'added',
    header: 'Added',
    cell: (r) => r.added,
    align: 'end',
    sortValue: (r) => r.added,
    priority: 'secondary',
  },
]

/**
 * A typed, sortable, paginated table on the panel look: grey header bar, inset hover pills and row dividers.
 * Columns pick alignment, emphasis, width, priority and sticky from bounded options; secondary columns fold
 * into an optional detail row when the table is too narrow.
 */
const meta: Meta<typeof DataTable<Row>> = {
  title: 'Safe UI/DataTable',
  component: DataTable as typeof DataTable<Row>,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof DataTable<Row>>

/** Strong first column, sortable headers, aligned and secondary columns, inside `DataTableCard`. */
export const Default: Story = {
  render: () => (
    <DataTableCard>
      <DataTable columns={columns} rows={ROWS} getRowKey={(r) => r.id} />
    </DataTableCard>
  ),
}

/** More rows than `pageSize` adds the pagination footer. */
export const Paginated: Story = {
  render: () => (
    <DataTableCard>
      <DataTable columns={columns} rows={manyRows(42)} getRowKey={(r) => r.id} pageSize={10} />
    </DataTableCard>
  ),
}

/** In the compact layout each row gets a toggle that reveals `renderRowDetail`. */
export const WithRowDetail: Story = {
  render: () => (
    <DataTableCard>
      <DataTable
        columns={columns}
        rows={ROWS}
        getRowKey={(r) => r.id}
        renderRowDetail={(r) => (
          <div className="text-muted-foreground text-sm">
            {r.name} · {r.role} · {r.safes} Safe accounts · added {r.added}
          </div>
        )}
      />
    </DataTableCard>
  ),
}

/** `onRowClick` makes the whole row a pointer target; nested buttons keep their own click. */
export const ClickableRows: Story = {
  render: () => (
    <DataTableCard>
      <DataTable
        columns={[
          ...columns.slice(0, 3),
          {
            id: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'end',
            cell: (r) => (
              <Button variant="ghost" size="sm" onClick={() => console.log('Edit', r.name)}>
                Edit
              </Button>
            ),
          },
        ]}
        rows={ROWS}
        getRowKey={(r) => r.id}
        onRowClick={(r) => console.log('Open', r.name)}
      />
    </DataTableCard>
  ),
}

/** Loading rows from `Skeleton` cells, and an `Empty` state below the header when there are no rows. */
export const LoadingAndEmpty: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <DataTableCard>
        <DataTable
          columns={columns.map((column) => ({ ...column, cell: () => <Skeleton className="h-4 w-24" /> }))}
          rows={['a', 'b', 'c'].map((id) => ({ ...ROWS[0], id }))}
          getRowKey={(r) => r.id}
        />
      </DataTableCard>
      <DataTableCard>
        <DataTable columns={columns} rows={[]} getRowKey={(r) => r.id} />
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRound />
            </EmptyMedia>
            <EmptyTitle>No members yet</EmptyTitle>
            <EmptyDescription>Invite signers to manage the Treasury together.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">Add member</Button>
          </EmptyContent>
        </Empty>
      </DataTableCard>
    </div>
  ),
}

/** Without rows the header still renders, so the column layout stays put. */
export const NoRows: Story = {
  render: () => (
    <DataTableCard>
      <DataTable columns={columns} rows={[]} getRowKey={(r) => r.id} />
    </DataTableCard>
  ),
}
