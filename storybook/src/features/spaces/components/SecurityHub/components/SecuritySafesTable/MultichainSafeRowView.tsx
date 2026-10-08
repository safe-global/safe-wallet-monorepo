import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react'
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

export type MultichainChildRowViewProps = {
  name: string
  childIdx: number
  isDeployed: boolean
  isSelected: boolean
  isScanning?: boolean
  href?: SafeHref
  balance?: string
  formattedBalance: string
  summary: GradeSummary | null
  onViewReport: () => void
  identicon: ReactNode
  chainLogo: ReactNode
  statusCell: ReactNode
}

/** Per-chain row rendered under an expanded multichain parent. */
export const MultichainChildRowView = ({
  name,
  childIdx,
  isDeployed,
  isSelected,
  isScanning,
  href,
  balance,
  formattedBalance,
  summary,
  onViewReport,
  identicon,
  chainLogo,
  statusCell,
}: MultichainChildRowViewProps) => (
  <motion.div
    data-testid="security-safe-row"
    data-selected={isSelected || undefined}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.15, delay: childIdx * 0.03 }}
    onClick={isDeployed ? onViewReport : undefined}
    className={cn(CARD_ROW_CLASS, GRID_COLS, {
      'cursor-pointer hover:bg-muted/100': isDeployed,
      'cursor-default': !isDeployed,
      'bg-muted/100 border-card': isSelected,
    })}
  >
    <div className={cn(CELL_BASE, 'gap-2 pl-7 ')}>
      {identicon}
      {href ? (
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 truncate text-sm text-muted-foreground no-underline hover:underline"
        >
          {name}
        </Link>
      ) : (
        <span className="min-w-0 truncate text-sm text-muted-foreground">{name}</span>
      )}
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
        <ChevronRight className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={<span />}
            tabIndex={0}
            className="text-right text-[0.65rem] leading-tight text-muted-foreground"
          >
            Not deployed
          </TooltipTrigger>
          <TooltipContent>Safe not yet deployed on this network</TooltipContent>
        </Tooltip>
      )}
    </div>
  </motion.div>
)

export type MultichainSafeRowViewProps = {
  address: string
  name?: string
  safeIdx: number
  hasAnimated: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  showMultichainWarning: boolean
  chainCount: number
  formattedTotalBalance: string
  aggregateSummary: GradeSummary | null
  aggregateScanning: boolean
  identicon: ReactNode
  copyButton: ReactNode
  networkLogos: ReactNode
  statusCell: ReactNode
  childRows: ReactNode
}

/**
 * Collapsed parent row for a multichain Safe + the child rows for each chain
 * when expanded. The parent aggregates balance/score/grade/scan-state across
 * all chain entries; clicking the row toggles expansion.
 */
export const MultichainSafeRowView = ({
  address,
  name,
  safeIdx,
  hasAnimated,
  isExpanded,
  onToggleExpand,
  showMultichainWarning,
  chainCount,
  formattedTotalBalance,
  aggregateSummary,
  aggregateScanning,
  identicon,
  copyButton,
  networkLogos,
  statusCell,
  childRows,
}: MultichainSafeRowViewProps) => {
  const parentName = name || shortenAddress(address)

  return (
    <>
      <motion.div
        data-testid="security-safe-row"
        variants={ROW_VARIANTS}
        initial={hasAnimated ? false : 'hidden'}
        animate="visible"
        transition={{ duration: 0.2, delay: hasAnimated ? 0 : safeIdx * 0.03 }}
        onClick={onToggleExpand}
        className={cn(CARD_ROW_CLASS, GRID_COLS, 'cursor-pointer hover:bg-muted/100', {
          'bg-muted/100 border-card': isExpanded,
        })}
      >
        <div className={CELL_BASE}>
          <div className="flex min-w-0 items-center gap-4">
            {identicon}
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="min-w-0 truncate text-[0.8125rem] font-bold" title={name || address}>
                  {parentName}
                </span>
                <button
                  type="button"
                  aria-label="Toggle networks"
                  data-testid="expand-networks"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpand()
                  }}
                  className="inline-flex shrink-0 items-center justify-center rounded p-0.5 text-muted-foreground hover:bg-muted/60"
                >
                  <ChevronDown className={cn('h-[18px] w-[18px] transition-transform', isExpanded && 'rotate-180')} />
                </button>
                {showMultichainWarning && (
                  <Tooltip>
                    <TooltipTrigger
                      render={<span aria-label="Signer setup differs across networks" />}
                      tabIndex={0}
                      className="inline-flex shrink-0 items-center"
                    >
                      <TriangleAlert className="h-[18px] w-[18px] text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>Signer setup differs across networks</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[0.6875rem] leading-none text-muted-foreground">
                  {shortenAddress(address)}
                </span>
                {copyButton}
              </div>
            </div>
          </div>
        </div>
        <div className={CELL_BASE}>
          <div className="flex items-center gap-1">
            {networkLogos}
            {chainCount > 3 && <span className="text-xs text-muted-foreground">+{chainCount - 3}</span>}
          </div>
        </div>
        <div className={cn(CELL_BASE, HIDE_BALANCE)}>
          <span className="text-sm font-bold text-foreground">{formattedTotalBalance}</span>
        </div>
        <div className={cn(CELL_BASE, 'justify-start')}>
          <ScoreCellView summary={aggregateSummary} isScanning={aggregateScanning} />
        </div>
        <div className={CELL_BASE}>{statusCell}</div>
        <div className={cn(CELL_BASE, 'justify-end')} />
      </motion.div>

      {childRows}
    </>
  )
}
