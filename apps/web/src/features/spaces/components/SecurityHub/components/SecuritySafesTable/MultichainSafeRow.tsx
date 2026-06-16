import { Fragment } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react'
import type { ScanResult } from '@/features/security/types'
import Identicon from '@/components/common/Identicon'
import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosList } from '@/features/multichain'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { cn } from '@/utils/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import StatusCell from '../StatusCell/StatusCell'
import { BalanceCell, ScoreCell } from './cells'
import { CARD_ROW_CLASS, CELL_BASE, GRID_COLS, HIDE_BALANCE, ROW_VARIANTS } from './constants'
import {
  formatBalance,
  getAggregateNonPassingCount,
  getAggregateSafeGrade,
  getAggregateSummary,
  getNonPassingCount,
  hasMultichainWarning,
  isAnyChainScanning,
  type GetSafeSecurityHref,
  type RowSecurity,
} from './utils'
import type { ChainEntry, SelectedSafe, SpaceSafeEntry } from '../../types'

export type MultichainSafeRowProps = {
  safe: SpaceSafeEntry
  safeIdx: number
  hasAnimated: boolean
  isExpanded: boolean
  onToggleExpand: (address: string) => void
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

type ChildRowProps = {
  safe: SpaceSafeEntry
  chain: ChainEntry
  childIdx: number
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

/** Per-chain row rendered under an expanded multichain parent. */
const MultichainChildRow = ({
  safe,
  chain,
  childIdx,
  selectedSafe,
  onViewReport,
  scanResults,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: ChildRowProps) => {
  const { scanKey, computeSummary, getSafeGrade } = security
  const key = scanKey(safe.address, chain.chainId)
  const results = scanResults[key]
  const summary = results ? computeSummary(results) : null
  const childGrade = results ? getSafeGrade(results) : null
  const childStatusCount = getNonPassingCount(results)
  const isSelected = sameAddress(selectedSafe?.address, safe.address) && selectedSafe?.chainId === chain.chainId
  const isScanning = scanningKeys?.has(key)
  const childHref = getSafeSecurityHref(safe.address, chain.chainId)
  const childName = safe.name || shortenAddress(safe.address)

  return (
    <motion.div
      data-testid="security-safe-row"
      data-selected={isSelected || undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: childIdx * 0.03 }}
      onClick={chain.isDeployed ? () => onViewReport(safe.address, chain.chainId) : undefined}
      className={cn(CARD_ROW_CLASS, GRID_COLS, {
        'cursor-pointer hover:bg-muted/100': chain.isDeployed,
        'cursor-default': !chain.isDeployed,
        'bg-muted/100 border-card': isSelected,
      })}
    >
      <div className={cn(CELL_BASE, 'gap-2 pl-7 ')}>
        <Identicon address={safe.address} size={24} />
        {childHref ? (
          <Link
            href={childHref}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 truncate text-sm text-muted-foreground no-underline hover:underline"
          >
            {childName}
          </Link>
        ) : (
          <span className="min-w-0 truncate text-sm text-muted-foreground">{childName}</span>
        )}
      </div>
      <div className={CELL_BASE}>
        <ChainIndicator chainId={chain.chainId} onlyLogo imageSize={18} />
      </div>
      <div className={cn(CELL_BASE, HIDE_BALANCE)}>
        <BalanceCell value={balanceMap[key]} isScanning={isScanning} />
      </div>
      <div className={cn(CELL_BASE, 'justify-start')}>
        <ScoreCell summary={summary} isScanning={isScanning} />
      </div>
      <div className={CELL_BASE}>
        <StatusCell grade={childGrade} count={childStatusCount} isScanning={isScanning} />
      </div>
      <div className={cn(CELL_BASE, 'justify-end')}>
        {chain.isDeployed ? (
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
}

/**
 * Collapsed parent row for a multichain Safe + the child rows for each chain
 * when expanded. The parent aggregates balance/score/grade/scan-state across
 * all chain entries; clicking the row toggles expansion.
 */
const MultichainSafeRow = ({
  safe,
  safeIdx,
  hasAnimated,
  isExpanded,
  onToggleExpand,
  selectedSafe,
  onViewReport,
  scanResults,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: MultichainSafeRowProps) => {
  const { scanKey, getSafeGrade } = security
  const aggregateSummary = getAggregateSummary(safe, scanResults, security)
  const aggregateGrade = getAggregateSafeGrade(safe, scanResults, scanKey, getSafeGrade)
  const aggregateNonPassing = getAggregateNonPassingCount(safe, scanResults, scanKey)
  const aggregateScanning = isAnyChainScanning(safe, scanningKeys, scanKey)
  const showMultichainWarning = hasMultichainWarning(safe, scanResults, scanKey)
  const totalBalance = safe.chainEntries.reduce(
    (sum, c) => sum + (Number(balanceMap[scanKey(safe.address, c.chainId)]) || 0),
    0,
  )
  const parentName = safe.name || shortenAddress(safe.address)

  return (
    <Fragment>
      <motion.div
        data-testid="security-safe-row"
        variants={ROW_VARIANTS}
        initial={hasAnimated ? false : 'hidden'}
        animate="visible"
        transition={{ duration: 0.2, delay: hasAnimated ? 0 : safeIdx * 0.03 }}
        onClick={() => onToggleExpand(safe.address)}
        className={cn(CARD_ROW_CLASS, GRID_COLS, 'cursor-pointer hover:bg-muted/100', {
          'bg-muted/100 border-card': isExpanded,
        })}
      >
        <div className={CELL_BASE}>
          <div className="flex min-w-0 items-center gap-4">
            <Identicon address={safe.address} size={32} />
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="min-w-0 truncate text-[0.8125rem] font-bold" title={safe.name || safe.address}>
                  {parentName}
                </span>
                <button
                  type="button"
                  aria-label="Toggle networks"
                  data-testid="expand-networks"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpand(safe.address)
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
              <span className="truncate text-[0.6875rem] leading-none text-muted-foreground">
                {shortenAddress(safe.address)}
              </span>
            </div>
          </div>
        </div>
        <div className={CELL_BASE}>
          <div className="flex items-center gap-1">
            <NetworkLogosList
              networks={safe.chainEntries.slice(0, 3).map((c) => ({ chainId: c.chainId }))}
              imageSize={18}
            />
            {safe.chainEntries.length > 3 && (
              <span className="text-xs text-muted-foreground">+{safe.chainEntries.length - 3}</span>
            )}
          </div>
        </div>
        <div className={cn(CELL_BASE, HIDE_BALANCE)}>
          <span className="text-sm font-bold text-foreground">{formatBalance(String(totalBalance))}</span>
        </div>
        <div className={cn(CELL_BASE, 'justify-start')}>
          <ScoreCell summary={aggregateSummary} isScanning={aggregateScanning} />
        </div>
        <div className={CELL_BASE}>
          <StatusCell grade={aggregateGrade} count={aggregateNonPassing} isScanning={aggregateScanning} />
        </div>
        <div className={cn(CELL_BASE, 'justify-end')} />
      </motion.div>

      {isExpanded &&
        safe.chainEntries.map((chain, childIdx) => (
          <MultichainChildRow
            key={scanKey(safe.address, chain.chainId)}
            safe={safe}
            chain={chain}
            childIdx={childIdx}
            selectedSafe={selectedSafe}
            onViewReport={onViewReport}
            scanResults={scanResults}
            scanningKeys={scanningKeys}
            balanceMap={balanceMap}
            security={security}
            getSafeSecurityHref={getSafeSecurityHref}
          />
        ))}
    </Fragment>
  )
}

export default MultichainSafeRow
