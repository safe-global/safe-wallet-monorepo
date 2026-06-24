import { motion } from 'motion/react'
import { cn } from '@/utils/cn'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SafeAppMockupAccount } from './types'
import MockupAccountRow, { sumOverviewsForAddress } from './MockupAccountRow'

interface MockupContentProps {
  accounts?: SafeAppMockupAccount[]
  safeOverviews: SafeOverview[] | undefined
  totalFormatted: string
  totalFiat: number
  highlight: 'switcher' | 'accounts' | 'none'
}

const MockupContent = ({ accounts, safeOverviews, totalFormatted, totalFiat, highlight }: MockupContentProps) => {
  const visibleAccounts = accounts?.slice(0, 4)

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-muted">
      <div className="flex items-center gap-3 px-6 pb-8 pt-4">
        <div className="h-9 w-60 shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
        <div className="flex-1" />
        <div className="size-9 shrink-0 rounded-full bg-[var(--color-background-skeleton)]" />
        <div className="h-9 w-32 shrink-0 rounded-full bg-[var(--color-background-skeleton)]" />
      </div>

      <div className="flex flex-col gap-4 px-6 pt-2">
        <div>
          <div className="mb-2 h-3 w-20 rounded-md bg-[var(--color-background-skeleton)]" />
          <span className="text-4xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {totalFiat > 0 ? totalFormatted : <span className="text-muted-foreground">{totalFormatted}</span>}
          </span>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
          <div className="h-9 w-[90px] shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
          <div className="h-9 w-[70px] shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
          <div className="h-9 w-32 shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-6 p-6 pt-14">
        <motion.div
          animate={{ scale: highlight === 'accounts' ? 1.05 : 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ transformOrigin: 'left center' }}
          className={cn(
            'flex flex-1 flex-col rounded-3xl bg-card overflow-hidden p-2',
            highlight === 'accounts' && 'ring-[5px] ring-[var(--color-success-main)]/25',
          )}
        >
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <span className="text-base font-semibold leading-tight text-foreground">Accounts</span>
            <div className="h-3 w-16 rounded-full bg-muted" />
          </div>

          <div className="flex flex-col">
            {visibleAccounts && visibleAccounts.length > 0
              ? visibleAccounts.map((account) => (
                  <MockupAccountRow
                    key={account.address}
                    account={account}
                    fiatValue={sumOverviewsForAddress(safeOverviews, account.address)}
                  />
                ))
              : [88, 70, 80].map((w, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3">
                    <div className="size-9 shrink-0 rounded-full bg-muted" />
                    <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                      <div className="h-2.5 rounded-full bg-muted" style={{ width: `${w}%` }} />
                      <div className="h-2 rounded-full bg-muted" style={{ width: `${w - 15}%` }} />
                    </div>
                    <div className="h-2.5 w-12 rounded-full bg-muted shrink-0" />
                  </div>
                ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default MockupContent
