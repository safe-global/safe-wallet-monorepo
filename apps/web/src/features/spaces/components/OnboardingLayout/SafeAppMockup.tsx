import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronDown, House, WalletCards, BookUser, UsersRound, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'
import Identicon from '@/components/common/Identicon'
import useSafeCardData from '../SelectSafesOnboarding/hooks/useSafeCardData'
import type { SafeItem } from '@/hooks/safes'
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
}

// ─── Space-selector-style avatar (rounded-md, brand green bg) ────────────────

/** Avatar matching the prototype: circular, bright Safe-green bg, first letter of name, no '?' placeholder */
const SpaceAvatar = ({ initial }: { initial: string }) => (
  <div className="shrink-0 flex size-9 items-center justify-center rounded-full bg-[var(--color-static-text-brand)] text-white text-sm font-semibold overflow-hidden">
    {initial}
  </div>
)

// ─── Compact-currency formatter for the aggregated balance ────────────────────

const compactFiatFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const formatTotalFiat = (n: number): string => '$' + compactFiatFormatter.format(n)

const parseFiatNumber = (formatted: string | undefined): number | null => {
  if (!formatted) return null
  const cleaned = formatted.replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// ─── Hidden probe component: fetches one safe's fiat value and reports up ─────

interface BalanceProbeProps {
  safe: SafeItem
  address: string
  onLoad: (address: string, value: number) => void
}

/**
 * Calls useSafeCardData for a single safe and bubbles its parsed numeric balance
 * up via callback. Renders nothing — purely used so SafeAppMockup can aggregate
 * fiat across all accounts without violating hooks-in-loop rules at the parent.
 */
const BalanceProbe = ({ safe, address, onLoad }: BalanceProbeProps) => {
  const { fiatValue } = useSafeCardData(safe)
  useEffect(() => {
    const num = parseFiatNumber(fiatValue)
    if (num !== null) onLoad(address, num)
  }, [fiatValue, address, onLoad])
  return null
}

// ─── Per-row account component (Option B: per-row hook call) ──────────────────

interface AccountRowProps {
  account: SafeAppMockupAccount
}

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

/**
 * Renders one Accounts-widget row. If a _safeItem is present, calls useSafeCardData
 * to get a live fiatValue; otherwise falls back to the pre-computed fiatValue string.
 * React hook rules are satisfied because the safe list is stable within a session.
 */
const AccountRow = ({ account }: AccountRowProps) => {
  const liveData = useSafeCardData(account._safeItem ?? ({ address: account.address, chainId: '' } as SafeItem))
  const fiatValue = account._safeItem ? liveData.fiatValue : account.fiatValue
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
        {fiatValue !== undefined ? fiatValue : <Skeleton className="h-3 w-12" />}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const SafeAppMockup = ({ name, highlight, accounts }: SafeAppMockupProps) => {
  const trimmed = name.trim()
  const displayName = trimmed || 'Your Space'
  // Initial follows displayName so empty state shows 'Y' (from "Your Space"), not '?'
  const initial = displayName.charAt(0).toUpperCase()

  const visibleAccounts = accounts?.slice(0, 4)

  // Aggregate fiat across ALL accounts (not just visible). Each probe component
  // calls useSafeCardData for its safe and reports the numeric value up here.
  const [balances, setBalances] = useState<Record<string, number>>({})
  const handleBalance = useCallback((address: string, value: number) => {
    setBalances((prev) => (prev[address] === value ? prev : { ...prev, [address]: value }))
  }, [])
  const totalFiat = useMemo(() => Object.values(balances).reduce((a, b) => a + b, 0), [balances])
  const probedAccounts = useMemo(() => (accounts ?? []).filter((a) => a._safeItem), [accounts])

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
              className="flex items-center gap-3 rounded-xl bg-muted p-3 transition-colors hover:bg-accent-secondary"
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
            {/* Hidden balance probes — one per account, used to aggregate total fiat */}
            {probedAccounts.map((a) => (
              <BalanceProbe key={a.address} safe={a._safeItem!} address={a.address} onLoad={handleBalance} />
            ))}

            {/* TOP BAR skeletons — title pill + round icon + pill, like the real app header */}
            <div className="flex items-center gap-3 px-6 pb-8 pt-4">
              <div className="h-9 w-60 shrink-0 rounded-xl bg-muted" />
              <div className="flex-1" />
              <div className="size-9 shrink-0 rounded-full bg-muted" />
              <div className="h-9 w-32 shrink-0 rounded-full bg-muted" />
            </div>

            {/* BALANCE BLOCK — small label skeleton + big $ total + filter chip skeletons */}
            <div className="flex flex-col gap-4 px-6 pt-2">
              <div>
                <div className="mb-2 h-3 w-20 rounded-md bg-muted" />
                <span className="text-4xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                  {totalFiat > 0 ? formatTotalFiat(totalFiat) : <span className="text-muted-foreground">$0</span>}
                </span>
              </div>
              {/* Filter chips */}
              <div className="flex gap-2">
                <div className="h-9 w-20 shrink-0 rounded-xl bg-muted" />
                <div className="h-9 w-[90px] shrink-0 rounded-xl bg-muted" />
                <div className="h-9 w-[70px] shrink-0 rounded-xl bg-muted" />
                <div className="h-9 w-32 shrink-0 rounded-xl bg-muted" />
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
                    ? visibleAccounts.map((account) => <AccountRow key={account.address} account={account} />)
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
