import { useMemo } from 'react'
import { motion } from 'motion/react'
import { ChevronDown, House, WalletCards, BookUser, UsersRound, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'
import Identicon from '@/components/common/Identicon'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { Skeleton } from '@/components/ui/skeleton'
import SafeLogo from '@/public/images/logo-no-text.svg'

export interface SafeAppMockupAccount {
  address: string
  name?: string
  fiatValue?: string
  /** Internal: raw SafeItem used to fetch live fiat data per row */
  _safeItem?: SafeItem
}

export interface SafeAppMockupProps {
  name: string
  highlight: 'switcher' | 'accounts' | 'none'
  accounts?: SafeAppMockupAccount[]
  /**
   * Flat list of SafeItems (one entry per chain) used to query and aggregate the
   * balance shown in the mockup's top-left "total value" position. Multi-chain
   * Safes contribute one SafeItem per chain so the total sums correctly.
   * Matches the real Spaces dashboard's AggregatedBalance pattern.
   */
  balanceSafes?: SafeItem[]
}

// ─── Space-selector-style avatar (rounded-md, brand green bg) ────────────────

/** Avatar matching the prototype: circular, bright Safe-green bg, first letter of name, no '?' placeholder */
const SpaceAvatar = ({ initial }: { initial: string }) => (
  <div className="shrink-0 flex size-9 items-center justify-center rounded-full bg-[var(--color-static-text-brand)] text-white text-sm font-semibold overflow-hidden">
    {initial}
  </div>
)

// ─── Currency formatters ──────────────────────────────────────────────────────

// Per-row formatter — full thousand-separated, two decimals max ($1,024 / $0.06).
const rowFiatFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})
const formatRowFiat = (n: number): string => '$' + rowFiatFormatter.format(n)

/**
 * Sums fiatTotal across all SafeOverview entries whose address matches `address`.
 * Multi-chain Safes are flattened to N overviews (one per chain), so summing
 * by address aggregates their balance.
 */
const sumOverviewsForAddress = (overviews: SafeOverview[] | undefined, address: string): number | null => {
  if (!overviews) return null
  let found = false
  let total = 0
  for (const o of overviews) {
    if (sameAddress(o.address.value, address)) {
      found = true
      total += Number(o.fiatTotal) || 0
    }
  }
  return found ? total : null
}

// ─── Per-row account component ───────────────────────────────────────────────

interface AccountRowProps {
  account: SafeAppMockupAccount
  /** Pre-computed fiat (in currency-major units) summed across all chains for this address. */
  fiatValue: number | null
}

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

/**
 * Renders one Accounts-widget row. If a _safeItem is present, calls useSafeCardData
 * to get a live fiatValue; otherwise falls back to the pre-computed fiatValue string.
 * React hook rules are satisfied because the safe list is stable within a session.
 */
const AccountRow = ({ account, fiatValue }: AccountRowProps) => {
  const displayFiat = fiatValue !== null ? formatRowFiat(fiatValue) : undefined
  // If no name is available, fall back to the shortened address as the primary text
  // (matches the real Safe app behaviour — never show a single bare character).
  const primaryText = account.name?.trim() || shortenAddress(account.address)

  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
      {/* Real Identicon (blo blockie) — matches the avatar used in Step 2's selector list */}
      <div className="shrink-0 overflow-hidden rounded-full">
        <Identicon address={account.address} size={32} />
      </div>

      {/* Name + address stacked */}
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="truncate text-sm leading-tight font-semibold text-foreground">{primaryText}</div>
        <div className="truncate text-xs leading-none text-muted-foreground tabular-nums">
          {shortenAddress(account.address)}
        </div>
      </div>

      {/* Fiat value right-aligned — matches AccountItem.Balance */}
      <div className="shrink-0 text-sm leading-tight font-medium tabular-nums text-foreground">
        {displayFiat !== undefined ? displayFiat : <Skeleton className="h-3 w-12" />}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const SafeAppMockup = ({ name, highlight, accounts, balanceSafes }: SafeAppMockupProps) => {
  const trimmed = name.trim()
  const displayName = trimmed || 'Your Space'
  // Initial follows displayName so empty state shows 'Y' (from "Your Space"), not '?'
  const initial = displayName.charAt(0).toUpperCase()

  const visibleAccounts = accounts?.slice(0, 4)

  // Bulk-query all selected Safes' overviews in one call — same pattern as the
  // real Spaces dashboard's AggregatedBalance.tsx. Each multi-chain Safe contributes
  // one SafeItem per chain, so summing across the response naturally aggregates.
  const { address: walletAddress } = useWallet() ?? {}
  const currency = useAppSelector(selectCurrency)
  const safesForQuery = balanceSafes ?? []
  const { data: safeOverviews } = useGetMultipleSafeOverviewsQuery({
    safes: safesForQuery,
    walletAddress,
    currency,
  })
  const totalFiat = useMemo(
    () => (safeOverviews ?? []).reduce((sum, o) => sum + Number(o.fiatTotal), 0),
    [safeOverviews],
  )
  const formattedTotal = formatCurrencyPrecise(totalFiat, currency)

  // Nav items matching the real spacesMainNavigation + spacesSetupGroup
  const navItems = [
    { Icon: House, width: '60%' },
    { Icon: WalletCards, width: '74%' },
    { Icon: BookUser, width: '80%' },
    { Icon: UsersRound, width: '55%' },
    { Icon: Settings, width: '65%' },
  ]

  return (
    // Outer container fills the parent aside panel, clips the oversized mockup,
    // and uses gradient overlays to fade out the right and bottom edges.
    <div className="relative h-full w-full overflow-hidden">
      {/* Gradient fade — right edge. Mirrors the technique used by Step 2's
          OnboardingSafesList scroll region: Tailwind bg-gradient-to-X + from/to. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/4 bg-gradient-to-r from-transparent to-muted" />
      {/* Gradient fade — bottom edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/4 bg-gradient-to-b from-transparent to-muted" />

      {/* Mockup rendered at "desktop" scale — only the top-left of the app is visible.
          Extra top/left padding so the inner card has breathing room from the aside edges. */}
      <div className="absolute left-50 top-50 flex w-[1500px] flex-col">
        {/* Inner app preview card — no outer border/bg; fills the visible area */}
        <div className="flex h-[900px] overflow-hidden rounded-3xl border bg-background shadow-sm">
          {/* ── Sidebar column ── */}
          <div className="flex w-[220px] shrink-0 flex-col gap-2 border-r p-4">
            {/* Safe logo — sits at top-left of the sidebar, inside the inner card */}
            <SafeLogo alt="Safe" width={24} height={24} className="mb-3 shrink-0" />

            {/* Workspace switcher — matches SpaceSelectorDropdown trigger */}
            <motion.div
              animate={{
                scale: highlight === 'switcher' ? 1.18 : 1,
                boxShadow:
                  highlight === 'switcher'
                    ? '0 0 0 1px #12FF80, 0 0 5px 5px rgba(18, 255, 128, 0.3)' // Safe brand green at 30% opacity — no opacity-modifier token available
                    : '0 0 0 0 rgba(18, 255, 128, 0)', // Safe brand green at 0% opacity — no opacity-modifier token available
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ transformOrigin: 'left center' }}
              className="flex items-center gap-3 rounded-xl bg-muted p-3 transition-colors hover:bg-[var(--color-secondary-background)]"
            >
              {/* Avatar: circular, brand green bg, letter initial */}
              <SpaceAvatar initial={initial} />
              {/* Name + "Space" subtitle — matches .spaceSelectorText */}
              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                <div className="truncate text-sm font-semibold leading-tight text-foreground">{displayName}</div>
                <div className="text-xs leading-none text-muted-foreground">Space</div>
              </div>
              {/* ChevronDown — single arrow pointing down */}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </motion.div>

            {/* Nav items — icon-circle + label bar echoing real NavItem skeleton */}
            <div className="flex flex-col gap-1 pt-1">
              {navItems.map(({ Icon, width }, i) => (
                <div key={i} className="flex h-10 items-center gap-3 rounded-lg px-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <div className="h-2.5 rounded-full bg-muted" style={{ width }} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Content column ── */}
          <div className="flex flex-1 flex-col overflow-hidden bg-muted">
            {/* TOP BAR skeletons — title pill + round icon + pill, like the real app header.
                Uses --color-background-skeleton (project's theme-aware skeleton token). */}
            <div className="flex items-center gap-3 px-6 pb-8 pt-4">
              <div className="h-9 w-60 shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
              <div className="flex-1" />
              <div className="size-9 shrink-0 rounded-full bg-[var(--color-background-skeleton)]" />
              <div className="h-9 w-32 shrink-0 rounded-full bg-[var(--color-background-skeleton)]" />
            </div>

            {/* BALANCE BLOCK — small label skeleton + big $ total + filter chip skeletons */}
            <div className="flex flex-col gap-4 px-6 pt-2">
              <div>
                <div className="mb-2 h-3 w-20 rounded-md bg-[var(--color-background-skeleton)]" />
                <span className="text-4xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                  {totalFiat > 0 ? formattedTotal : <span className="text-muted-foreground">{formattedTotal}</span>}
                </span>
              </div>
              {/* Filter chips */}
              <div className="flex gap-2">
                <div className="h-9 w-20 shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
                <div className="h-9 w-[90px] shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
                <div className="h-9 w-[70px] shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
                <div className="h-9 w-32 shrink-0 rounded-xl bg-[var(--color-background-skeleton)]" />
              </div>
            </div>

            {/* Two-column widget row: Accounts left, secondary widget right */}
            <div className="flex min-h-0 flex-1 gap-6 p-6 pt-14">
              {/* ── Accounts widget — matches SafeWidgetRoot + AccountWidgetItem ── */}
              <motion.div
                animate={{ scale: highlight === 'accounts' ? 1.05 : 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ transformOrigin: 'left center' }}
                className={cn(
                  'flex flex-1 flex-col rounded-3xl bg-card overflow-hidden p-2',
                  highlight === 'accounts' &&
                    'ring-2 ring-[var(--color-static-text-brand)] shadow-[0_0_0_5px_rgba(18,255,128,0.25)]', // rgba: Safe brand green at 25% opacity — no opacity-modifier token available
                )}
              >
                {/* Widget header — aligned with row content (same px-4) */}
                <div className="flex items-center justify-between px-4 pb-2 pt-4">
                  <span className="text-base font-semibold leading-tight text-foreground">Accounts</span>
                  <div className="h-3 w-16 rounded-full bg-muted" />
                </div>

                {/* Account rows — px-0 on wrapper, each row provides its own px-4 */}
                <div className="flex flex-col">
                  {visibleAccounts && visibleAccounts.length > 0
                    ? visibleAccounts.map((account) => (
                        <AccountRow
                          key={account.address}
                          account={account}
                          fiatValue={sumOverviewsForAddress(safeOverviews, account.address)}
                        />
                      ))
                    : /* Empty state skeleton rows */
                      [88, 70, 80].map((w, i) => (
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
        </div>
      </div>
    </div>
  )
}

export default SafeAppMockup
