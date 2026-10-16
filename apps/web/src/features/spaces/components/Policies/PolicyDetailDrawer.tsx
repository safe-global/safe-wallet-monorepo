import { useContext, type ReactElement, type ReactNode } from 'react'
import { Chip } from '@safe-global/views/components/ui/chip'
import { Sheet, SheetContent } from '@safe-global/views/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { AnimatePresence, motion } from 'framer-motion'
import { Ban, CalendarClock, Clock, ExternalLink, LifeBuoy, ShieldCheck, Trash2, WalletMinimal, X } from 'lucide-react'
import { safeFormatUnits, shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatDateTime, relativeTime } from '@safe-global/utils/utils/date'
import EthHashInfo from '@/components/common/EthHashInfo'
import { ChainLogo, SafeIdenticon, ShortAddressWithTooltip } from './shared/safeIdentity'
import { Button } from '@safe-global/views/components/ui/button'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useChain } from '@/hooks/useChains'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveSpendingLimitFlow } from '@/components/tx-flow/flows'
import type { SpendingLimitState } from '@/features/spending-limits/types'
import type { SafeRecoveryConfig } from './hooks/useSafeRecovery'
import { isFallbackAccess } from './policyAccess'
import { FallbackBadge } from './shared/FallbackBadge'

type SafeRef = { chainId: string; address: string; name: string }

type SpendingLimitDetail = {
  type: 'spending-limit'
  beneficiary: string
  limits: SpendingLimitState[]
  safe: SafeRef
}

type RecoveryDetail = {
  type: 'recovery'
  recoverer: string
  config: SafeRecoveryConfig
  safe: SafeRef
}

type TokenWithdrawDetail = {
  type: 'erc20-transfer'
  safe: SafeRef
  allowlist: Array<{
    token: { address: string; symbol: string }
    recipients: Array<{ address: string; name?: string | null }>
  }>
}

/**
 * A change described only by its on-chain bindings — what a pending request looks
 * like when nothing decoded it into a known policy type.
 */
type PolicyBindingsDetail = {
  type: 'bindings'
  safe: SafeRef
  bindings: Array<{
    target: string
    selector: string
    operation: 'CALL' | 'DELEGATECALL'
    policyContract: string | null
    data?: string | null
  }>
}

export type PolicyDetail = SpendingLimitDetail | RecoveryDetail | TokenWithdrawDetail | PolicyBindingsDetail

/** Request metadata shown for a policy change that is requested but not yet applied. */
export type PendingRequestInfo = {
  configureRoot: string
  /** False while the `requestConfiguration` transaction is still waiting to execute. */
  isRootConfigured?: boolean
  requestedAt: number
  readyAt: number | null
  isReady: boolean
}

type PolicyDetailDrawerProps = {
  policy: PolicyDetail | null
  /** Present for a pending request: adds the root and delay rows, and the Pending header. */
  request?: PendingRequestInfo
  /** Marks a policy bound to the guard's catch-all access. */
  isFallback?: boolean
  onClose: () => void
}

const POLICY_TITLE: Record<PolicyDetail['type'], string> = {
  'spending-limit': 'Spending limit',
  recovery: 'Account recovery',
  'erc20-transfer': 'Token withdraw allowlist',
  bindings: 'Policy change',
}

const POLICY_ENFORCER: Record<PolicyDetail['type'], string> = {
  'spending-limit': 'Safe Allowance Module',
  recovery: 'Safe Delay Modifier',
  'erc20-transfer': 'Safe Policy Guard',
  bindings: 'Safe Policy Guard',
}

const PolicyIcon = ({ type }: { type: PolicyDetail['type'] }): ReactElement => {
  if (type === 'spending-limit') return <WalletMinimal size={13} />
  if (type === 'recovery') return <LifeBuoy size={13} />
  return <Ban size={13} />
}

/** CGW sends unix seconds; the date helpers take milliseconds. */
const unixToLabel = (seconds: number): string => formatDateTime(seconds * 1000)

const formatDuration = (sec: bigint): string => {
  const s = Number(sec)
  if (!Number.isFinite(s) || s <= 0) return '0s'
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'}`
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
}

const resetLabel = (resetTimeMin: string): string => {
  if (resetTimeMin === '0') return 'One-time'
  const min = Number(resetTimeMin)
  if (!Number.isFinite(min) || min <= 0) return 'One-time'
  if (min === 1440) return 'Daily'
  if (min === 10080) return 'Weekly'
  if (min === 43200) return 'Monthly'
  const days = Math.round(min / 1440)
  return `Every ${days} ${days === 1 ? 'day' : 'days'}`
}

const resetCadenceLabel = (limits: SpendingLimitState[]): string => {
  if (limits.length === 0) return '—'
  const cadences = new Set(limits.map((l) => resetLabel(l.resetTimeMin)))
  return cadences.size === 1 ? Array.from(cadences)[0] : 'Mixed'
}

/* ----------------------------- Summary card ------------------------------ */

const SummaryRow = ({ label, value, divider = true }: { label: string; value: ReactNode; divider?: boolean }) => (
  <div className={cn('flex flex-row items-start gap-4 px-4 py-3', divider && 'border-t border-border')}>
    <Typography
      variant="paragraph-mini-medium"
      className="w-21 shrink-0 pt-[3px] tracking-wider text-muted-foreground uppercase"
    >
      {label}
    </Typography>
    <div className="min-w-0 flex-1 text-sm font-semibold">{value}</div>
  </div>
)

const SummaryCard = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
)

/* ------------------------------ Token row -------------------------------- */

type TokenRowProps = {
  limit: SpendingLimitState
  chainId: string
  safe: SafeRef
}

const TokenRow = ({ limit, chainId, safe }: TokenRowProps) => {
  const { setTxFlow } = useContext(TxModalContext)
  const chain = useChain(chainId)
  const decimals = limit.token.decimals
  const symbol = limit.token.symbol || '?'
  const amount = safeFormatUnits(BigInt(limit.amount), decimals)
  const spent = safeFormatUnits(BigInt(limit.spent), decimals)
  const isOneTime = limit.resetTimeMin === '0'
  const reset = isOneTime ? 'One-time' : relativeTime(limit.lastResetMin, limit.resetTimeMin)

  const spentNum = Number(spent)
  const amountNum = Number(amount)
  const progress =
    Number.isFinite(spentNum) && Number.isFinite(amountNum) && amountNum > 0
      ? Math.min(100, Math.max(0, (spentNum / amountNum) * 100))
      : 0

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!chain?.shortName) return
    const url = new URL(window.location.href)
    url.searchParams.set('safe', `${chain.shortName}:${safe.address}`)
    window.history.replaceState({}, '', url.toString())
    setTxFlow(<RemoveSpendingLimitFlow spendingLimit={limit} />)
  }

  return (
    <div className="flex min-w-0 flex-row items-center gap-2.5">
      {limit.token.logoUri ? (
        <img src={limit.token.logoUri} alt={symbol} className="size-5 shrink-0 rounded-full" />
      ) : (
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-background-main)] text-[8px] font-bold text-muted-foreground">
          {symbol.slice(0, 3).toUpperCase()}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-row items-baseline justify-between gap-2">
          <Typography variant="paragraph-small-bold">{symbol}</Typography>
          <Typography variant="paragraph-small-bold" className="tabular-nums">
            {amount}
          </Typography>
        </div>
        {!isOneTime && (
          <>
            <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-[var(--color-background-main)]">
              <div
                className={cn(
                  'h-full transition-[width,background-color] duration-200',
                  progress >= 90 ? 'bg-destructive' : progress >= 50 ? 'bg-warning-accent' : 'bg-accent-success',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 flex flex-row justify-between">
              <Typography variant="paragraph-mini" className="text-muted-foreground tabular-nums">
                {spent} spent
              </Typography>
              <Typography variant="paragraph-mini" className="text-muted-foreground">
                resets {reset}
              </Typography>
            </div>
          </>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${symbol} spending limit`}
              className="shrink-0 cursor-pointer rounded p-1 text-muted-foreground opacity-55 transition-[opacity,color] duration-150 hover:text-destructive hover:opacity-100"
            />
          }
        >
          <Trash2 size={13} />
        </TooltipTrigger>
        <TooltipContent side="top">Remove this limit</TooltipContent>
      </Tooltip>
    </div>
  )
}

/* ------------------------------ The drawer ------------------------------- */

const PolicyDetailDrawer = ({ policy, request, isFallback, onClose }: PolicyDetailDrawerProps): ReactElement => {
  const beneficiary =
    policy?.type === 'spending-limit' ? policy.beneficiary : policy?.type === 'recovery' ? policy.recoverer : ''
  const contact = useAddressBookItem(beneficiary, policy?.safe.chainId)
  const chain = useChain(policy?.safe.chainId ?? '')

  const isSpendingFallback =
    policy?.type === 'spending-limit' &&
    policy.limits.length === 0 &&
    policy.beneficiary.toLowerCase() === policy.safe.address.toLowerCase()

  const settingsHref =
    policy && chain?.shortName ? `/settings/modules?safe=${chain.shortName}:${policy.safe.address}` : null

  const cadenceLabel = policy?.type === 'spending-limit' ? resetCadenceLabel(policy.limits) : null

  return (
    <Sheet open={!!policy} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        size="md"
        padding="none"
        surface="paper"
        // eslint-disable-next-line no-restricted-syntax -- the header/body own their spacing; the sheet's own gap would double it
        className="flex-col gap-0 overflow-hidden"
        aria-label="Policy details"
      >
        {/* The sheet animates itself; this crossfades the CONTENT when the reader switches
            from one policy to another without the sheet ever closing. */}
        <AnimatePresence mode="wait">
          {policy && (
            <motion.div
              key={`${policy.type}:${beneficiary}:${policy.safe.address}:${request?.configureRoot ?? ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex shrink-0 flex-row items-center justify-between border-b border-border bg-card px-6 py-4">
                <div className="flex flex-row items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-[7px] bg-[var(--color-background-main)]">
                    <PolicyIcon type={policy.type} />
                  </div>
                  <Typography variant="paragraph-small-bold">{POLICY_TITLE[policy.type]}</Typography>
                  {isFallback && <FallbackBadge />}
                  {request && (
                    <Chip variant={request.isReady ? 'success' : 'outline'} size="sm">
                      {request.isRootConfigured === false
                        ? 'Not requested yet'
                        : request.isReady
                          ? 'Ready to apply'
                          : 'Pending'}
                    </Chip>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close policy details">
                  <X size={16} />
                </Button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6">
                <SummaryCard>
                  <SummaryRow
                    divider={false}
                    label="From"
                    value={
                      <div className="flex flex-row items-center gap-2">
                        <SafeIdenticon address={policy.safe.address} size={22} />
                        <div className="flex min-w-0 flex-col">
                          <Typography variant="paragraph-small-bold" className="leading-tight">
                            {policy.safe.name || 'Safe'}
                          </Typography>
                          <EthHashInfo
                            address={policy.safe.address}
                            chainId={policy.safe.chainId}
                            shortAddress
                            avatarSize={0}
                            showCopyButton={false}
                          />
                        </div>
                        <div className="flex-1" />
                        <ChainLogo chainId={policy.safe.chainId} size={16} />
                      </div>
                    }
                  />

                  {policy.type === 'spending-limit' && (
                    <SummaryRow
                      label="Spender"
                      value={
                        isSpendingFallback ? (
                          <Typography variant="paragraph-small" className="text-muted-foreground">
                            Details unavailable
                          </Typography>
                        ) : (
                          <div className="flex flex-row items-center gap-2">
                            <SafeIdenticon address={policy.beneficiary} size={22} />
                            <div className="flex min-w-0 flex-col">
                              {contact?.name && (
                                <Typography variant="paragraph-small-bold" className="truncate leading-tight">
                                  {contact.name}
                                </Typography>
                              )}
                              <ShortAddressWithTooltip address={policy.beneficiary} />
                            </div>
                          </div>
                        )
                      }
                    />
                  )}

                  {policy.type === 'recovery' && (
                    <SummaryRow
                      label="Recoverer"
                      value={
                        <div className="flex flex-row items-center gap-2">
                          <SafeIdenticon address={policy.recoverer} size={22} />
                          <div className="flex min-w-0 flex-col">
                            {contact?.name && (
                              <Typography variant="paragraph-small-bold" className="truncate leading-tight">
                                {contact.name}
                              </Typography>
                            )}
                            <ShortAddressWithTooltip address={policy.recoverer} />
                          </div>
                        </div>
                      }
                    />
                  )}

                  {policy.type === 'spending-limit' && (
                    <SummaryRow
                      label={cadenceLabel === 'One-time' ? 'Limit' : `Per ${cadenceLabel?.toLowerCase() ?? 'period'}`}
                      value={
                        policy.limits.length === 0 ? (
                          <Typography variant="paragraph-mini" className="text-muted-foreground italic">
                            No active token limits — setup may be pending execution.
                          </Typography>
                        ) : (
                          <div className="flex flex-col gap-2.5">
                            {policy.limits.map((limit) => (
                              <TokenRow
                                key={`${limit.token.address}-${limit.nonce}`}
                                limit={limit}
                                chainId={policy.safe.chainId}
                                safe={policy.safe}
                              />
                            ))}
                          </div>
                        )
                      }
                    />
                  )}

                  {policy.type === 'spending-limit' && policy.limits.length > 0 && (
                    <SummaryRow
                      label="Resets"
                      value={<Typography variant="paragraph-small-bold">{cadenceLabel}</Typography>}
                    />
                  )}

                  {policy.type === 'recovery' && (
                    <>
                      <SummaryRow
                        label="Cooldown"
                        value={
                          <div className="flex flex-row items-center gap-1.5">
                            <Clock size={13} color="#737373" />
                            <Typography variant="paragraph-small-bold">
                              {formatDuration(policy.config.cooldownSec)}
                            </Typography>
                          </div>
                        }
                      />
                      <SummaryRow
                        label="Expires"
                        value={
                          <div className="flex flex-row items-center gap-1.5">
                            <CalendarClock size={13} color="#737373" />
                            <Typography variant="paragraph-small-bold">
                              {policy.config.expirySec === 0n ? 'Never' : formatDuration(policy.config.expirySec)}
                            </Typography>
                          </div>
                        }
                      />
                      <SummaryRow
                        label="Module"
                        value={
                          <Typography variant="paragraph-mini" className="font-mono text-muted-foreground">
                            {shortenAddress(policy.config.delayModifierAddress)}
                          </Typography>
                        }
                      />
                    </>
                  )}

                  {policy.type === 'bindings' &&
                    (policy.bindings.length === 0 ? (
                      <SummaryRow
                        label="Change"
                        value={
                          <Typography variant="paragraph-mini" className="text-muted-foreground">
                            Details unavailable — the original payload wasn&apos;t stored for this request.
                          </Typography>
                        }
                      />
                    ) : (
                      policy.bindings.map((binding, index) => (
                        <SummaryRow
                          key={`${binding.target}:${binding.selector}:${index}`}
                          label={`Rule ${index + 1}`}
                          value={
                            <div className="flex flex-col gap-1">
                              {isFallbackAccess(binding) ? (
                                <div className="flex flex-row items-center gap-1.5">
                                  <Typography variant="paragraph-small-bold">Any transaction</Typography>
                                  <FallbackBadge />
                                </div>
                              ) : (
                                <div className="flex flex-row items-center gap-1.5">
                                  <Typography variant="paragraph-small-bold">Target</Typography>
                                  <ShortAddressWithTooltip address={binding.target} />
                                </div>
                              )}
                              {!isFallbackAccess(binding) && (
                                <Typography variant="paragraph-mini" className="font-mono text-muted-foreground">
                                  {binding.selector} · {binding.operation}
                                </Typography>
                              )}
                              {binding.policyContract && (
                                <div className="flex flex-row items-center gap-1.5">
                                  <Typography variant="paragraph-mini" className="text-muted-foreground">
                                    Policy
                                  </Typography>
                                  <ShortAddressWithTooltip address={binding.policyContract} />
                                </div>
                              )}
                            </div>
                          }
                        />
                      ))
                    ))}

                  {request && (
                    <>
                      <SummaryRow
                        label="Root"
                        value={
                          <Tooltip>
                            <TooltipTrigger
                              render={<span className="cursor-default font-mono text-[12.5px] text-muted-foreground" />}
                            >
                              {shortenAddress(request.configureRoot)}
                            </TooltipTrigger>
                            <TooltipContent>{request.configureRoot}</TooltipContent>
                          </Tooltip>
                        }
                      />
                      <SummaryRow
                        label="Requested"
                        value={
                          <Typography variant="paragraph-small-bold">{unixToLabel(request.requestedAt)}</Typography>
                        }
                      />
                      <SummaryRow
                        label={request.isReady ? 'Ready since' : 'Ready at'}
                        value={
                          <div className="flex flex-row items-center gap-1.5">
                            <Clock size={13} color="#737373" />
                            <Typography variant="paragraph-small-bold">
                              {/* No delay to report until the request is on-chain. */}
                              {request.readyAt === null
                                ? 'Once the request transaction is executed'
                                : unixToLabel(request.readyAt)}
                            </Typography>
                          </div>
                        }
                      />
                    </>
                  )}

                  {policy.type === 'erc20-transfer' &&
                    policy.allowlist.map((entry) => (
                      <SummaryRow
                        key={entry.token.address}
                        label={entry.token.symbol}
                        value={
                          <div className="flex flex-col items-end gap-1">
                            {entry.recipients.map((r) => (
                              <Typography key={r.address} variant="paragraph-small-bold">
                                {r.name || shortenAddress(r.address)}
                              </Typography>
                            ))}
                          </div>
                        }
                      />
                    ))}
                </SummaryCard>

                {/* Enforced-by footnote, matching the wizard summary */}
                <div className="mt-3 flex flex-row items-center gap-1.5 px-1 text-[11.5px] font-semibold text-muted-foreground">
                  <ShieldCheck size={12} color="#1C5538" />
                  Enforced by {POLICY_ENFORCER[policy.type]}
                </div>

                {/* CTAs */}
                {settingsHref && (
                  <div className="mt-6 flex flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(settingsHref, '_blank', 'noreferrer')}
                      className="flex-1"
                    >
                      <ExternalLink className="size-4" />
                      Manage on Safe
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  )
}

export default PolicyDetailDrawer
