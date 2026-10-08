import type { ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { SafeGrade } from '@/features/security/types'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CARD_ROW_CLASS,
  CELL_BASE,
  COLUMNS,
  GRID_COLS,
  HIDE_BALANCE,
} from '@views/features/spaces/components/SecurityHub/components/SecuritySafesTable/constants'

export type SecuritySafesTableViewProps = {
  isLoading: boolean
  safesCount: number
  gradeFilter?: SafeGrade | null
  rows: ReactNode
}

export const SecuritySafesTableView = ({
  isLoading,
  safesCount,
  gradeFilter,
  rows,
}: SecuritySafesTableViewProps): ReactElement => (
  <div className="mb-10 w-full overflow-x-auto">
    <div className="min-w-[960px]">
      <div
        className={cn(
          'grid w-full items-center gap-2 border-2 border-transparent pb-1 pl-3 pr-3 sm:pl-6 sm:pr-6',
          GRID_COLS,
        )}
      >
        {COLUMNS.map((c, i) => (
          <div
            key={c.label || `col-${i}`}
            className={cn('text-[0.65rem] font-bold uppercase tracking-[0.5px] text-muted-foreground', c.hideClass, {
              'justify-end': c.align === 'right',
            })}
          >
            {c.label}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-1.5" data-testid="security-safes-table-skeleton">
          {Array.from({ length: Math.min(Math.max(safesCount, 1), 6) }).map((_, i) => (
            <div key={i} className={cn(CARD_ROW_CLASS, GRID_COLS, 'border-transparent')}>
              {/* Account: identicon + name/address — mirrors SingleSafeRow's first cell */}
              <div className={CELL_BASE}>
                <div className="flex min-w-0 items-center gap-2">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-32 max-w-full rounded" />
                    <Skeleton className="h-2.5 w-24 max-w-full rounded" />
                  </div>
                </div>
              </div>
              {/* Network */}
              <div className={CELL_BASE}>
                <Skeleton className="size-[18px] rounded-full" />
              </div>
              {/* Balance (collapses below sm, same as the data cell) */}
              <div className={cn(CELL_BASE, HIDE_BALANCE)}>
                <Skeleton className="h-4 w-14 rounded" />
              </div>
              {/* Score */}
              <div className={CELL_BASE}>
                <Skeleton className="h-4 w-9 rounded" />
              </div>
              {/* Status */}
              <div className={CELL_BASE}>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              {/* Chevron */}
              <div className={cn(CELL_BASE, 'justify-end')}>
                <Skeleton className="size-5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={gradeFilter ?? 'all'}
            className="flex flex-col gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {rows}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  </div>
)
