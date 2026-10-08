import type { ReactNode } from 'react'
import { TableBody, TableHead, TableHeader, TableRow, TableSortIcon, tableVariants } from '@/components/ui/table'
import tableCss from './styles.module.css'
import { cn } from '@/utils/cn'
import type { SafeAccountColumn } from '@views/features/myAccounts/components/SafeAccountsTable/columns'
import type { SafeSortColumn } from '@/features/myAccounts/components/SafeAccountsTable/useSafeAccountRows'

export type SafeAccountsTableSort = { orderBy: SafeSortColumn | null; order: 'asc' | 'desc' }

export type SafeAccountsTableViewProps = {
  testId: string
  embedded: boolean
  bordered: boolean
  minWidth: number
  visibleColumns: SafeAccountColumn[]
  sort: SafeAccountsTableSort
  sortableColumns: boolean
  hasSelection: boolean
  onSort: (column: SafeSortColumn) => void
  isReorderable: boolean
  reorderableBody: ReactNode
  rows: ReactNode
  isRenaming: boolean
  allowRenameInDialog: boolean
  renderRenameDialog: (props: { className?: string; overlayClassName?: string }) => ReactNode
}

export const SafeAccountsTableView = ({
  testId,
  embedded,
  bordered,
  minWidth,
  visibleColumns,
  sort,
  sortableColumns,
  hasSelection,
  onSort,
  isReorderable,
  reorderableBody,
  rows,
  isRenaming,
  allowRenameInDialog,
  renderRenameDialog,
}: SafeAccountsTableViewProps) => {
  return (
    <div data-testid={testId} className="w-full">
      <div
        className={cn(
          'w-full',
          embedded ? 'overflow-x-visible' : 'overflow-x-auto',
          !embedded && tableCss.container,
          // `bordered={false}` drops the panel's edge — for tables nested in something that draws its own.
          !embedded && !bordered && tableCss.containerBorderless,
        )}
      >
        {/* Raw <table> instead of the ui <Table> wrapper: we own the horizontal-scroll container
            above so `embedded` tables can opt out of it. The shadcn table sub-components are used
            throughout. */}
        <table
          className={cn(tableVariants({ variant: 'panel' }), tableCss.accounts)}
          style={{ tableLayout: 'fixed', minWidth: embedded ? undefined : minWidth }}
        >
          {/* Embedded (headerless) tables need a colgroup to keep fixed-layout column widths; the Name
              column is left unsized so it flexes to fill the card, while the stat columns stay fixed. */}
          {embedded && (
            <colgroup>
              {visibleColumns.map((column) => (
                <col key={column.id} style={column.id === 'name' ? undefined : { width: column.width }} />
              ))}
            </colgroup>
          )}

          {!embedded && (
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => {
                  const active = sort.orderBy === column.sortKey
                  const canSort = column.sortable && column.sortKey && sortableColumns
                  return (
                    <TableHead
                      key={column.id}
                      aria-sort={active ? (sort.order === 'asc' ? 'ascending' : 'descending') : undefined}
                      // Indents the NAME label so it sits above the account name text rather than the
                      // avatar (see styles.module.css) — a leading checkbox column already offsets
                      // the cell, so it needs less.
                      data-name-head={column.id === 'name' ? (hasSelection ? 'selection' : 'default') : undefined}
                      className="px-2 py-2.5"
                      style={{ width: column.width, textAlign: column.align ?? 'left' }}
                    >
                      {canSort ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => onSort(column.sortKey as SafeSortColumn)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              onSort(column.sortKey as SafeSortColumn)
                            }
                          }}
                          data-testid={`account-sort-${column.id}`}
                          className="hover:text-foreground group/sort inline-flex cursor-pointer items-center gap-1 uppercase select-none"
                        >
                          {column.label}
                          <TableSortIcon direction={active ? sort.order : undefined} />
                        </span>
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
          )}

          {isReorderable ? reorderableBody : <TableBody>{rows}</TableBody>}
        </table>
      </div>

      {isRenaming &&
        renderRenameDialog({
          // In a modal surface, sit above the shadcn Dialog (--z-overlay) instead of behind it.
          className: allowRenameInDialog ? 'z-[var(--z-nested-overlay)]' : undefined,
          overlayClassName: allowRenameInDialog ? 'z-[var(--z-nested-overlay)]' : undefined,
        })}
    </div>
  )
}
