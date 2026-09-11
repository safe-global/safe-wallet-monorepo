import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { ScanResult } from '@/features/security/types'
import Identicon from '@/components/common/Identicon'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'
import ChainIndicator from '@/components/common/ChainIndicator'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { cn } from '@/utils/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import StatusCell from '../StatusCell/StatusCell'
import { BalanceCell, ScoreCell } from './cells'
import { CARD_ROW_CLASS, CELL_BASE, GRID_COLS, HIDE_BALANCE, ROW_VARIANTS } from './constants'
import { getNonPassingCount, type GetSafeSecurityHref, type RowSecurity } from './utils'
import type { SelectedSafe, SpaceSafeEntry } from '../../types'

export type SingleSafeRowProps = {
  safe: SpaceSafeEntry
  safeIdx: number
  hasAnimated: boolean
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

/** Row for a Safe deployed on exactly one chain. */
const SingleSafeRow = ({
  safe,
  safeIdx,
  hasAnimated,
  selectedSafe,
  onViewReport,
  scanResults,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: SingleSafeRowProps) => {
  const { scanKey, computeSummary, getSafeGrade } = security
  const key = scanKey(safe.address, safe.chainId)
  const results = scanResults[key]
  const summary = results ? computeSummary(results) : null
  const grade = results ? getSafeGrade(results) : null
  const statusCount = getNonPassingCount(results)
  const isSelected = selectedSafe?.address === safe.address && selectedSafe?.chainId === safe.chainId
  const isScanning = scanningKeys?.has(key)
  const safeHref = getSafeSecurityHref(safe.address, safe.chainId)
  const isDeployed = safe.chainEntries[0]?.isDeployed !== false
  const safeName = safe.name || shortenAddress(safe.address)

  return (
    <motion.div
      data-testid="security-safe-row"
      data-selected={isSelected || undefined}
      variants={ROW_VARIANTS}
      initial={hasAnimated ? false : 'hidden'}
      animate="visible"
      transition={{ duration: 0.2, delay: hasAnimated ? 0 : safeIdx * 0.03 }}
      onClick={isDeployed ? () => onViewReport(safe.address, safe.chainId) : undefined}
      className={cn(CARD_ROW_CLASS, GRID_COLS, {
        'cursor-pointer hover:bg-muted/100': isDeployed,
        'cursor-default': !isDeployed,
        'border-primary': isSelected,
      })}
    >
      <div className={CELL_BASE}>
        <div className="flex min-w-0 items-center gap-4">
          <Identicon address={safe.address} size={32} />
          <div className="flex min-w-0 flex-col gap-1.5">
            {safeHref ? (
              <Link
                href={safeHref}
                title={safe.name || safe.address}
                onClick={(e) => e.stopPropagation()}
                className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.8125rem] font-bold text-inherit no-underline hover:underline"
              >
                {safeName}
              </Link>
            ) : (
              <span
                title={safe.name || safe.address}
                className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.8125rem] font-bold text-inherit"
              >
                {safeName}
              </span>
            )}
            <div className="flex min-w-0 items-center gap-1">
              <span className="text-[0.6875rem] leading-none text-muted-foreground">
                {shortenAddress(safe.address)}
              </span>
              <CopyAddressIconButton address={safe.address} />
            </div>
          </div>
        </div>
      </div>
      <div className={CELL_BASE}>
        <ChainIndicator chainId={safe.chainId} onlyLogo imageSize={18} />
      </div>
      <div className={cn(CELL_BASE, HIDE_BALANCE)}>
        <BalanceCell value={balanceMap[key]} isScanning={isScanning} />
      </div>
      <div className={cn(CELL_BASE, 'justify-start')}>
        <ScoreCell summary={summary} isScanning={isScanning} />
      </div>
      <div className={CELL_BASE}>
        <StatusCell grade={grade} count={statusCount} isScanning={isScanning} />
      </div>
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

export default SingleSafeRow
