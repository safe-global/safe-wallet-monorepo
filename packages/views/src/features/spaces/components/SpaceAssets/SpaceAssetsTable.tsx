import type { ReactElement, ReactNode, Ref } from 'react'
import { TableBody, TableHead, TableHeader, TableRow, tableVariants } from '@safe-global/views/components/ui/table'
import CollapseAllButton, {
  type CollapseAllButtonProps,
} from '@safe-global/views/features/spaces/components/SpaceQueue/CollapseAllButton'
import { cn } from '@safe-global/views/utils/cn'
import { ASSETS_COLUMN_WIDTHS, ASSETS_COLUMNS, ASSETS_TABLE_MIN_WIDTH } from './columns'

type SpaceAssetsTableProps = {
  collapseAll?: CollapseAllButtonProps
  /** The table is wider than its panel: its first column stays pinned */
  scrollsX?: boolean
  panelRef?: Ref<HTMLDivElement>
  children: ReactNode
}

/** The queue's table, with the assets' columns: a band for tokens and one for positions, then a row per asset */
const SpaceAssetsTable = ({ collapseAll, scrollsX, panelRef, children }: SpaceAssetsTableProps): ReactElement => (
  // A container, so a wider table scrolls in the panel instead of widening the page
  <div
    ref={panelRef}
    data-scrolls-x={scrollsX ? '' : undefined}
    className="@container w-full overflow-x-auto rounded-lg border border-transparent bg-[var(--color-background-paper)] pb-2 [--table-pin-surface:var(--color-background-paper)]"
  >
    <table
      aria-label="Assets"
      className={cn(tableVariants({ variant: 'panel' }), 'table-fixed [&_td]:px-4', ASSETS_TABLE_MIN_WIDTH)}
    >
      <colgroup>
        {ASSETS_COLUMNS.map((column) => (
          <col key={column} style={{ width: ASSETS_COLUMN_WIDTHS[column] }} />
        ))}
      </colgroup>
      <TableHeader>
        <TableRow data-no-hover className="group/head">
          <TableHead scope="col" data-pin="start" className="px-0! py-0">
            <span className="flex min-h-10 items-center justify-center">
              {collapseAll ? <CollapseAllButton {...collapseAll} iconOnly /> : <span className="sr-only">Expand</span>}
            </span>
          </TableHead>
          <TableHead scope="col" className="px-4 py-2.5">
            Asset
          </TableHead>
          <TableHead scope="col" className="px-4 py-2.5">
            Network
          </TableHead>
          <TableHead scope="col" className="px-4 py-2.5 text-right">
            Balance
          </TableHead>
          <TableHead scope="col" className="px-4 py-2.5 text-right">
            Value
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </table>
  </div>
)

export default SpaceAssetsTable
