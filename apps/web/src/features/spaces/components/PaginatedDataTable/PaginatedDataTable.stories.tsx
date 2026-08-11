import type { Meta, StoryObj } from '@storybook/react'
import PaginatedDataTable, { type DataTableColumn } from './index'

/**
 * PaginatedDataTable Component Stories
 *
 * The shared, design-system-bounded table that powers the Spaces Members and
 * Address Book tables. Consumers pass typed columns (alignment, emphasis, width,
 * priority, sticky, sortValue) and rows; the table owns styling, sorting,
 * pagination, responsive column dropping, and the optional mobile detail row.
 */
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

const meta: Meta<typeof PaginatedDataTable<Row>> = {
  title: 'Features/Spaces/PaginatedDataTable',
  component: PaginatedDataTable as typeof PaginatedDataTable<Row>,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof PaginatedDataTable<Row>>

/** Basic table: strong first column, sortable headers, aligned + secondary columns. */
export const Default: Story = {
  render: () => <PaginatedDataTable columns={columns} rows={ROWS} getRowKey={(r) => r.id} />,
}

/** More rows than the page size surfaces the pagination footer. */
export const Paginated: Story = {
  render: () => <PaginatedDataTable columns={columns} rows={manyRows(42)} getRowKey={(r) => r.id} pageSize={10} />,
}

/** Optional mobile-only collapsible detail row, revealed per row via a toggle. */
export const WithRowDetail: Story = {
  render: () => (
    <PaginatedDataTable
      columns={columns}
      rows={ROWS}
      getRowKey={(r) => r.id}
      renderRowDetail={(r) => (
        <div className="text-muted-foreground text-sm">
          {r.name} · {r.role} · {r.safes} Safe accounts · added {r.added}
        </div>
      )}
    />
  ),
}

/** Empty dataset renders the header with no body rows. */
export const Empty: Story = {
  render: () => <PaginatedDataTable columns={columns} rows={[]} getRowKey={(r) => r.id} />,
}
