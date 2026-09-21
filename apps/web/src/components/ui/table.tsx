'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { cn } from '@/utils/cn'
import css from './table.module.css'

/**
 * Table Component
 *
 * Semantic table layout (Table, TableHeader, TableBody, TableRow, TableHead, TableCell, etc.).
 *
 * @see https://ui.shadcn.com/docs/components/base/table
 *
 * @example
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>Value</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 *
 * @remarks
 * Key Props:
 * - Table: wraps in scroll container
 * - TableRow: `data-state` (e.g. selected)
 * - All components: `className` — see Base UI
 */

/**
 * `panel`: grey rounded header bar, inset rounded hover pills painted on the cells, gradient row
 * dividers. Renders inside a surface its parent draws — it brings its own edge insets, so the
 * surface must not pad it a second time. Exported for tables that assemble their own `<table>`.
 */
const tableVariants = cva('w-full caption-bottom text-sm', {
  variants: {
    variant: {
      default: '',
      panel: css.table,
    },
  },
  defaultVariants: { variant: 'default' },
})

function Table({ className, variant, ...props }: React.ComponentProps<'table'> & VariantProps<typeof tableVariants>) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn(tableVariants({ variant }), className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors', className)}
      {...props}
    />
  )
}

/**
 * Sort affordance for a header label: the direction when the column is sorted, otherwise a hint that
 * fades in on hover or keyboard focus. The hint holds its space either way, so a header never
 * reflows as it appears. Put `group/sort` on the control that wraps the label and this icon.
 */
function TableSortIcon({ direction }: { direction?: 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="size-3.5" aria-hidden />
  if (direction === 'desc') return <ArrowDown className="size-3.5" aria-hidden />
  return (
    <ArrowUpDown
      className="size-3.5 opacity-0 transition-opacity group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50"
      aria-hidden
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption data-slot="table-caption" className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableSortIcon,
  tableVariants,
}
