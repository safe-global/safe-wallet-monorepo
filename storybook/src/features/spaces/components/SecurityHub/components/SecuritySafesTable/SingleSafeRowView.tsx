import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { GradeSummary } from '@/features/security/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { cn } from '@/utils/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SafeHref } from '@/features/spaces/utils/safeHref'
import { BalanceCellView, ScoreCellView } from './CellsView'
import {
  CARD_ROW_CLASS,
  CELL_BASE,
  GRID_COLS,
  HIDE_BALANCE,
  ROW_VARIANTS,
} from '@views/features/spaces/components/SecurityHub/components/SecuritySafesTable/constants'

export type SingleSafeRowViewProps = {
  address: string
  name?: string
  safeIdx: number
  hasAnimated: boolean
  isDeployed: boolean
  isSelected: boolean
  isScanning?: boolean
  href?: SafeHref
  balance?: string
  formattedBalance: string
  summary: GradeSummary | null
  onViewReport: () => void
  identicon: ReactNode
  copyButton: ReactNode
  chainLogo: ReactNode
  statusCell: ReactNode
}

/** Row for a Safe deployed on exactly one chain. */
export const SingleSafeRowView = ({
  address,
  name,
  safeIdx,
  hasAnimated,
  isDeployed,
  isSelected,
  isScanning,
  href,
  balance,
  formattedBalance,
  summary,
  onViewReport,
  identicon,
  copyButton,
  chainLogo,
  statusCell,
}: SingleSafeRowViewProps) => {
  const safeName = name || shortenAddress(address)

  return (
    <motion.div
      data-testid="security-safe-row"
      data-selected={isSelected || undefined}
      variants={ROW_VARIANTS}
      initial={hasAnimated ? false : 'hidden'}
      animate="visible"
      transition={{ duration: 0.2, delay: hasAnimated ? 0 : safeIdx * 0.03 }}
      onClick={isDeployed ? onViewReport : undefined}
      className={cn(CARD_ROW_CLASS, GRID_COLS, {
        'cursor-pointer hover:bg-muted/100': isDeployed,
        'cursor-default': !isDeployed,
        'border-primary': isSelected,
      })}
    >
      <div className={CELL_BASE}>
        <div className="flex min-w-0 items-center gap-4">
          {identicon}
          <div className="flex min-w-0 flex-col gap-1.5">
            {href ? (
              <Link
                href={href}
                title={name || address}
                onClick={(e) => e.stopPropagation()}
                className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.8125rem] font-bold text-inherit no-underline hover:underline"
              >
                {safeName}
              </Link>
            ) : (
              <span
                title={name || address}
                className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.8125rem] font-bold text-inherit"
              >
                {safeName}
              </span>
            )}
            <div className="flex min-w-0 items-center gap-1">
              <span className="text-[0.6875rem] leading-none text-muted-foreground">{shortenAddress(address)}</span>
              {copyButton}
            </div>
          </div>
        </div>
      </div>
      <div className={CELL_BASE}>{chainLogo}</div>
      <div className={cn(CELL_BASE, HIDE_BALANCE)}>
        <BalanceCellView value={balance} formattedValue={formattedBalance} isScanning={isScanning} />
      </div>
      <div className={cn(CELL_BASE, 'justify-start')}>
        <ScoreCellView summary={summary} isScanning={isScanning} />
      </div>
      <div className={CELL_BASE}>{statusCell}</div>
      <div className={cn(CELL_BASE, 'justify-end')}>
        {isDeployed ? (
          <ChevronRight className={cn('h-5 w-5 align-middle', isSelected ? 'text-primary' : 'text-muted-foreground')} />
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={<span />}
              tabIndex={0}
              className="inline-block text-right leading-tight whitespace-normal text-xs text-muted-foreground"
            >
              Not deployed
            </TooltipTrigger>
            <TooltipContent>Safe not yet deployed on this network</TooltipContent>
          </Tooltip>
        )}
      </div>
    </motion.div>
  )
}
