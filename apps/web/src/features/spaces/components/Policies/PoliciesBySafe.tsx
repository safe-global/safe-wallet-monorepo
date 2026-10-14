import { Fragment, useId, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@safe-global/views/components/ui/accordion'
import { Button } from '@safe-global/views/components/ui/button'
import { Collapsible, CollapsibleContent } from '@safe-global/views/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import {
  Ban,
  ChevronDown,
  ChevronRight,
  Coins,
  LifeBuoy,
  Plus,
  Settings2,
  Shield,
  ShieldCheck,
  ShieldOff,
  WalletMinimal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  activePolicyKey,
  PolicyType,
  type ActivePolicy,
  type AvailablePolicy,
  type PendingPolicy,
} from '@safe-global/store/gateway/policies/types'
import { AppRoutes } from '@/config/routes'
import { ChainLogo, SafeIdenticon } from './shared/safeIdentity'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useSpaceSafes } from '@/features/spaces'
import { flattenSafes, safeRefKey, type SafeRef } from './safeRefs'
import { entryLabelOf, entrySummaryOf, labelOf, tokensOf } from './policyLabels'
import { isFallbackAccess, isFallbackActivePolicy } from './policyAccess'
import { isSafeManagementPolicy } from './SafeManagementPolicy/identify'
import { SAFE_MANAGEMENT_FUNCTIONS } from './SafeManagementPolicy/contracts'
import { toPendingDetail, toPolicyDetail } from './policyDetails'
import { useActivePolicies } from './hooks/useActivePolicies'
import { useAvailablePolicies } from './hooks/useAvailablePolicies'
import { usePendingPolicies } from './hooks/usePendingPolicies'
import { applyPlanOf, useApplyPendingPolicy, type PendingRow } from './hooks/useApplyPendingPolicy'
import { usePolicyRequests } from './policyRequestStore'
import { APPLY_BLOCKED_MESSAGE } from './shared/applyPlan'
import { FallbackBadge } from './shared/FallbackBadge'
import { TokenBadge } from './shared/TokenBadge'
import PolicyDetailDrawer, { type PendingRequestInfo, type PolicyDetail } from './PolicyDetailDrawer'

/** The wizard each policy type opens. Types without one can't be configured yet. */
const WIZARD_BY_TYPE: Partial<Record<PolicyType, string>> = {
  [PolicyType.SpendingLimit]: 'spendingLimit',
  [PolicyType.Recovery]: 'accountRecovery',
  [PolicyType.TokenWithdraw]: 'tokenWithdraw',
  [PolicyType.Cosigner]: 'cosigner',
  // One flow for all three fallback policies; the type rides along in the query.
  [PolicyType.Allow]: 'fallback',
  [PolicyType.NativeTransfer]: 'fallback',
  [PolicyType.Deny]: 'fallback',
}

const ICON_BY_TYPE: Partial<Record<PolicyType, LucideIcon>> = {
  [PolicyType.SpendingLimit]: WalletMinimal,
  [PolicyType.Recovery]: LifeBuoy,
  [PolicyType.TokenWithdraw]: Ban,
  [PolicyType.Allow]: ShieldCheck,
  [PolicyType.Deny]: ShieldOff,
  [PolicyType.NativeTransfer]: Coins,
}

/** Why a catalogue entry can't be configured right now, if it can't. */
const blockedReason = (entry: AvailablePolicy): string => {
  if (!entry.available) return 'This policy isn’t available on this network yet.'
  // Without the guard/module addresses there is nothing to build the transaction against.
  if (!entry.enforcement) return 'Enforcement details are missing for this policy, so it can’t be configured yet.'
  if (!WIZARD_BY_TYPE[entry.type]) return 'Configuring this policy from the wallet is coming soon.'

  return ''
}

/** Beyond a few, badges stop being a cue and start being noise. */
const MAX_TOKEN_BADGES = 3

type OpenDetail = { detail: PolicyDetail; request?: PendingRequestInfo; isFallback: boolean }

const requestInfoOf = (pending: PendingPolicy): PendingRequestInfo => ({
  configureRoot: pending.configureRoot,
  isRootConfigured: pending.isRootConfigured,
  requestedAt: pending.requestedAt,
  readyAt: pending.readyAt,
  isReady: pending.isReady,
})

/** Which policy type a pending row is about, when anything says so. */
const pendingTypeOf = (row: PendingRow): PolicyType | undefined => row.pending.policy?.type ?? row.local?.type

const hasFallbackAccess = (row: PendingRow): boolean => {
  const bindings = row.pending.policies
  if (bindings?.length) return bindings.some(isFallbackAccess)

  return !!row.local?.configurations.some(isFallbackAccess)
}

/* ------------------------------- Entry rows ------------------------------- */

const EntryRow = ({
  ariaLabel,
  label,
  summary,
  badges,
  action,
  onOpen,
}: {
  ariaLabel: string
  label: ReactNode
  summary?: string
  badges?: ReactNode
  action?: ReactNode
  onOpen: () => void
}) => (
  <div
    role="button"
    tabIndex={0}
    aria-label={`${ariaLabel} details`}
    onClick={onOpen}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen()
      }
    }}
    className="group flex cursor-pointer flex-row items-center gap-2.5 rounded-xl bg-[var(--color-background-main)] px-2.5 py-2.5 transition-colors duration-150 hover:bg-accent"
  >
    <div className="max-w-[45%] min-w-0">{label}</div>
    {badges}
    {summary && (
      <Typography variant="paragraph-mini" className="min-w-0 flex-1 truncate text-muted-foreground">
        {summary}
      </Typography>
    )}
    <div className={cn(summary ? 'flex-0' : 'flex-1')} />
    {action}
    <ChevronRight size={16} color="#A1A3A7" className="transition-transform duration-150 group-hover:translate-x-0.5" />
  </div>
)

const ActiveEntry = ({
  policy,
  safe,
  onOpenDetail,
}: {
  policy: ActivePolicy
  safe: SafeRef
  onOpenDetail: (open: OpenDetail) => void
}) => {
  const detail = toPolicyDetail(policy, safe)
  const isFallback = isFallbackActivePolicy(policy)
  const tokens = tokensOf(policy)
  const scope = entryLabelOf(policy)

  return (
    <EntryRow
      ariaLabel={scope}
      label={
        tokens.length > 0 ? (
          <div className="flex min-w-0 flex-row items-center gap-2">
            {tokens.slice(0, MAX_TOKEN_BADGES).map((token) => (
              <TokenBadge key={token.address} token={token} />
            ))}
            {tokens.length > MAX_TOKEN_BADGES && (
              <Typography variant="paragraph-mini" className="text-muted-foreground">
                +{tokens.length - MAX_TOKEN_BADGES}
              </Typography>
            )}
          </div>
        ) : (
          <Typography variant="paragraph-small-bold" className="truncate">
            {scope}
          </Typography>
        )
      }
      summary={entrySummaryOf(policy)}
      badges={isFallback ? <FallbackBadge /> : undefined}
      onOpen={() => detail && onOpenDetail({ detail, isFallback })}
    />
  )
}

const PendingEntry = ({
  row,
  safe,
  onOpenDetail,
  onApply,
}: {
  row: PendingRow
  safe: SafeRef
  onOpenDetail: (open: OpenDetail) => void
  onApply: (row: PendingRow) => void
}) => {
  const nowSec = Math.floor(Date.now() / 1000)
  const plan = applyPlanOf(row, nowSec)
  const { isRootConfigured, readyAt } = row.pending
  const isReady = row.pending.isReady || (readyAt !== null && nowSec >= readyAt)
  const hoursLeft = readyAt === null ? 0 : Math.max(0, Math.ceil((readyAt - nowSec) / 3600))
  const blockedMessage = plan.canApply ? '' : APPLY_BLOCKED_MESSAGE[plan.reason]
  // The delay only starts once the request transaction executes.
  const status = isRootConfigured === false ? 'Not requested yet' : isReady ? 'Ready' : `~${hoursLeft}h left`

  const tokens = row.local?.data?.allowlist.map((entry) => entry.token) ?? row.local?.tokens ?? []
  const scope = tokens.length > 0 ? tokens.map((token) => token.symbol).join(' · ') : 'Requested change'

  return (
    <EntryRow
      ariaLabel={scope}
      label={
        tokens.length > 0 ? (
          <div className="flex min-w-0 flex-row items-center gap-2">
            {tokens.slice(0, MAX_TOKEN_BADGES).map((token) => (
              <TokenBadge key={token.address} token={token} />
            ))}
          </div>
        ) : (
          <Typography variant="paragraph-small-bold" className="truncate">
            {scope}
          </Typography>
        )
      }
      summary={`Root ${shortenAddress(row.pending.configureRoot)}`}
      badges={hasFallbackAccess(row) ? <FallbackBadge /> : undefined}
      action={
        <div className="flex flex-row items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Typography variant="paragraph-mini" className="text-muted-foreground">
            {status}
          </Typography>
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button size="sm" disabled={!plan.canApply} onClick={() => onApply(row)}>
                Apply
              </Button>
            </TooltipTrigger>
            <TooltipContent>{blockedMessage}</TooltipContent>
          </Tooltip>
        </div>
      }
      onOpen={() =>
        onOpenDetail({
          detail: toPendingDetail({ pending: row.pending, local: row.local, safe }),
          request: requestInfoOf(row.pending),
          isFallback: hasFallbackAccess(row),
        })
      }
    />
  )
}

/* ------------------------------- Disclosure ------------------------------- */

type SectionProps = {
  icon: ReactNode
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * A collapsible section whose header is a plain row, so it can hold its own buttons —
 * an AccordionSummary is a button itself, and nesting Add inside one is invalid markup
 * that also makes the button ambiguous to assistive tech.
 */
const Section = ({ icon, title, meta, action, defaultOpen = false, children }: SectionProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className="border-t border-border">
      <div onClick={() => setOpen((v) => !v)} className="flex min-h-15 cursor-pointer flex-row items-center gap-3 py-1">
        {icon}
        {title}
        {meta}

        <div className="flex-1" />

        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}

        <Button
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={open ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
        >
          <ChevronDown
            size={16}
            color="#A1A3A7"
            className={cn('transition-transform duration-150', open && 'rotate-180')}
          />
        </Button>
      </div>

      <Collapsible open={open}>
        {/* Indented to the section title, so entries read as belonging to it. */}
        <CollapsibleContent id={contentId} className="pb-5 pl-0 sm:pl-[42px]">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/* ---------------------------- Policy type block --------------------------- */

/** Nothing configured needs no badge — the Add button is the signal. */
type PolicyTypeBlockProps = {
  safe: SafeRef
  entry: AvailablePolicy
  active: ActivePolicy[]
  pendingRows: PendingRow[]
  onAdd: (type: PolicyType) => void
  onOpenDetail: (open: OpenDetail) => void
  onApply: (row: PendingRow) => void
}

const PolicyTypeBlock = ({ safe, entry, active, pendingRows, onAdd, onOpenDetail, onApply }: PolicyTypeBlockProps) => {
  const Icon = ICON_BY_TYPE[entry.type] ?? Shield
  const blocked = blockedReason(entry)
  const isEmpty = active.length === 0 && pendingRows.length === 0

  return (
    <Section
      defaultOpen={!isEmpty}
      icon={
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-accent">
          <Icon size={15} color="#1C5538" />
        </div>
      }
      title={
        <Typography variant="paragraph-small-bold" className="truncate tracking-tight">
          {entry.title || labelOf(entry.type)}
        </Typography>
      }
      action={
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <Button variant="outline" size="sm" disabled={!!blocked} onClick={() => onAdd(entry.type)}>
              <Plus size={14} /> Add
            </Button>
          </TooltipTrigger>
          <TooltipContent>{blocked}</TooltipContent>
        </Tooltip>
      }
    >
      <div className="flex flex-col gap-2">
        {entry.description && (
          <Typography variant="paragraph-mini" className="mb-1 block text-muted-foreground">
            {entry.description}
          </Typography>
        )}

        {active.map((policy, index) => (
          <ActiveEntry key={activePolicyKey(policy, index)} policy={policy} safe={safe} onOpenDetail={onOpenDetail} />
        ))}

        {pendingRows.map((row) => (
          <PendingEntry
            key={row.pending.configureRoot}
            row={row}
            safe={safe}
            onOpenDetail={onOpenDetail}
            onApply={onApply}
          />
        ))}

        {isEmpty && (
          <Typography variant="paragraph-mini" className="text-muted-foreground italic">
            {blocked || 'Not configured on this Safe yet.'}
          </Typography>
        )}
      </div>
    </Section>
  )
}

/* ------------------------------ Fallback block ---------------------------- */

/** One option for the fallback slot: what it does, and whether it can be installed. */
const FallbackChoiceRow = ({
  entry,
  onAdd,
}: {
  entry: AvailablePolicy
  onAdd: (type: PolicyType) => void
}): ReactElement => {
  const Icon = ICON_BY_TYPE[entry.type] ?? Shield
  const blocked = blockedReason(entry)

  return (
    <div className="flex flex-row items-center gap-2.5 px-2.5 py-1.5">
      <Icon size={15} color="#737373" />
      <Typography variant="paragraph-small-bold" className="truncate">
        {entry.title || labelOf(entry.type)}
      </Typography>
      <Typography variant="paragraph-mini" className="min-w-0 flex-1 truncate text-muted-foreground">
        {entry.description}
      </Typography>
      <Tooltip>
        <TooltipTrigger render={<span />}>
          <Button variant="outline" size="sm" disabled={!!blocked} onClick={() => onAdd(entry.type)}>
            <Plus size={14} /> Add
          </Button>
        </TooltipTrigger>
        <TooltipContent>{blocked}</TooltipContent>
      </Tooltip>
    </div>
  )
}

const FallbackBlock = ({
  safe,
  catalogue,
  active,
  pendingRows,
  onAdd,
  onOpenDetail,
  onApply,
}: {
  safe: SafeRef
  catalogue: AvailablePolicy[]
  active: ActivePolicy[]
  pendingRows: PendingRow[]
  onAdd: (type: PolicyType) => void
  onOpenDetail: (open: OpenDetail) => void
  onApply: (row: PendingRow) => void
}) => {
  const isEmpty = active.length === 0 && pendingRows.length === 0

  return (
    <Section
      defaultOpen={!isEmpty}
      icon={
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-background-main)]">
          <Shield size={15} color="#737373" />
        </div>
      }
      title={
        <Typography variant="paragraph-small-bold" className="tracking-tight">
          Fallback
        </Typography>
      }
      meta={
        <>
          <Typography variant="paragraph-mini" className="text-muted-foreground">
            only one applies at a time
          </Typography>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <Typography variant="paragraph-mini" className="mb-1 block text-muted-foreground">
          Covers any transaction no other policy matches. Installing one replaces the current fallback.
        </Typography>

        {active.map((policy, index) => (
          <ActiveEntry key={activePolicyKey(policy, index)} policy={policy} safe={safe} onOpenDetail={onOpenDetail} />
        ))}

        {pendingRows.map((row) => (
          <PendingEntry
            key={row.pending.configureRoot}
            row={row}
            safe={safe}
            onOpenDetail={onOpenDetail}
            onApply={onApply}
          />
        ))}

        {isEmpty && (
          <Typography variant="paragraph-mini" className="text-muted-foreground italic">
            No fallback policy on this Safe.
          </Typography>
        )}

        {/* The choices for this slot, from the catalogue's `isFallback` entries. */}
        {catalogue.map((entry) => (
          <FallbackChoiceRow key={entry.type} entry={entry} onAdd={onAdd} />
        ))}
      </div>
    </Section>
  )
}

/* -------------------------------- Safe card ------------------------------- */

const SafePolicyCard = ({ safe, onOpenDetail }: { safe: SafeRef; onOpenDetail: (open: OpenDetail) => void }) => {
  const router = useRouter()
  const contact = useAddressBookItem(safe.address, safe.chainId)
  const { policies: catalogue, isLoading: catalogueLoading } = useAvailablePolicies(safe.chainId, safe.address)
  const { policies: active } = useActivePolicies(safe.chainId, safe.address)
  const { policies: pending, refetch } = usePendingPolicies(safe.chainId, safe.address)
  const { requests } = usePolicyRequests(safe.chainId, safe.address)
  const onApply = useApplyPendingPolicy(safe, refetch)

  const pendingRows = useMemo<PendingRow[]>(
    () =>
      pending.map((item) => ({
        pending: item,
        local: requests.find((request) => request.configureRoot.toLowerCase() === item.configureRoot.toLowerCase()),
      })),
    [pending, requests],
  )

  const grouped = useMemo(() => {
    // Safe management is AllowPolicy on the Safe's own selectors, so it would otherwise land
    // among the `allow` entries — which the catalogue files under the catch-all. Split it out
    // first; what remains is grouped by access.
    const safeManagement = active.filter(isSafeManagementPolicy)
    const rest = active.filter((policy) => !isSafeManagementPolicy(policy))

    return {
      safeManagement,
      fallbackActive: rest.filter(isFallbackActivePolicy),
      fallbackPending: pendingRows.filter(hasFallbackAccess),
      specificActive: rest.filter((policy) => !isFallbackActivePolicy(policy)),
      specificPending: pendingRows.filter((row) => !hasFallbackAccess(row)),
    }
  }, [active, pendingRows])

  // A policy whose type has no block of its own — a scoped allow or deny, say — still has to
  // be reachable, or it would vanish from the page while being live on-chain.
  const blockedTypes = useMemo(
    () => new Set(catalogue.filter((entry) => !entry.isFallback).map((entry) => entry.type)),
    [catalogue],
  )
  const otherActive = useMemo(
    () => grouped.specificActive.filter((policy) => !blockedTypes.has(policy.type)),
    [grouped.specificActive, blockedTypes],
  )

  // Anything CGW couldn't attribute to a policy type still has to be reachable.
  const untypedPending = grouped.specificPending.filter((row) => !pendingTypeOf(row))

  const onAdd = (type: PolicyType) => {
    const flow = WIZARD_BY_TYPE[type]
    if (!flow) return

    void router.push({
      pathname: AppRoutes.spaces.policies,
      query: {
        ...router.query,
        policy: flow,
        // `policySafe` preselects the Safe so the wizard can skip its Safe-picker step.
        policySafe: `${safe.chainId}:${safe.address}`,
        // The fallback flow serves three policies, so it needs to know which.
        ...(flow === 'fallback' ? { fallbackType: type } : {}),
      },
    })
  }

  const name = contact?.name || safe.name
  // The accordion addresses its one item by value; the Safe is what the card is about.
  const safeId = `${safe.chainId}:${safe.address}`

  return (
    <Accordion defaultValue={[safeId]} className="overflow-hidden rounded-2xl border border-border">
      <AccordionItem value={safeId}>
        <AccordionTrigger className="min-h-19 px-5">
          <div className="flex min-w-0 flex-1 flex-row items-center gap-3 pr-4">
            <SafeIdenticon address={safe.address} size={36} />

            <div className="flex min-w-0 flex-col">
              {name && (
                <Typography variant="paragraph-bold" className="truncate tracking-tight">
                  {name}
                </Typography>
              )}
              <div className="flex flex-row items-center gap-1.5">
                <Typography variant="paragraph-small" className="truncate text-muted-foreground tabular-nums">
                  {shortenAddress(safe.address)}
                </Typography>
                <ChainLogo chainId={safe.chainId} size={14} />
              </div>
            </div>

            <div className="flex-1" />

            <Typography variant="paragraph-mini-medium" className="text-muted-foreground">
              {active.length} active {active.length === 1 ? 'policy' : 'policies'}
              {pendingRows.length > 0 ? ` · ${pendingRows.length} pending` : ''}
            </Typography>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-5 pt-0 pb-3">
          {catalogue.length === 0 && !catalogueLoading ? (
            <Typography variant="paragraph-mini" className="block py-2 text-muted-foreground italic">
              No policies are available on this network yet.
            </Typography>
          ) : (
            catalogue
              .filter((entry) => !entry.isFallback)
              .map((entry) => (
                <PolicyTypeBlock
                  key={entry.type}
                  safe={safe}
                  entry={entry}
                  active={grouped.specificActive.filter((policy) => policy.type === entry.type)}
                  pendingRows={grouped.specificPending.filter((row) => pendingTypeOf(row) === entry.type)}
                  onAdd={onAdd}
                  onOpenDetail={onOpenDetail}
                  onApply={onApply}
                />
              ))
          )}

          {grouped.safeManagement.length > 0 && (
            <Section
              defaultOpen
              icon={
                <div className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-accent">
                  <Settings2 size={15} color="#1C5538" />
                </div>
              }
              title={
                <Typography variant="paragraph-small-bold" className="tracking-tight">
                  Safe management
                </Typography>
              }
              meta={
                <Typography variant="paragraph-mini-medium" className="text-muted-foreground">
                  {grouped.safeManagement.length} of {SAFE_MANAGEMENT_FUNCTIONS.length} changes allowed
                </Typography>
              }
            >
              <div className="flex flex-col gap-1">
                {grouped.safeManagement.map((policy, index) => (
                  <ActiveEntry
                    key={activePolicyKey(policy, index)}
                    policy={policy}
                    safe={safe}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            </Section>
          )}

          {otherActive.length > 0 && (
            <Section
              icon={
                <div className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-background-main)]">
                  <Shield size={15} color="#737373" />
                </div>
              }
              title={
                <Typography variant="paragraph-small-bold" className="tracking-tight">
                  Other policies
                </Typography>
              }
              meta={
                <Typography variant="paragraph-mini-medium" className="text-muted-foreground">
                  {otherActive.length}
                </Typography>
              }
            >
              <div className="flex flex-col gap-1">
                {otherActive.map((policy, index) => (
                  <ActiveEntry
                    key={activePolicyKey(policy, index)}
                    policy={policy}
                    safe={safe}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            </Section>
          )}

          <FallbackBlock
            safe={safe}
            catalogue={catalogue.filter((entry) => entry.isFallback)}
            onAdd={onAdd}
            active={grouped.fallbackActive}
            pendingRows={grouped.fallbackPending}
            onOpenDetail={onOpenDetail}
            onApply={onApply}
          />

          {untypedPending.length > 0 && (
            <Section
              defaultOpen
              icon={
                <div className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-background-main)]">
                  <Shield size={15} color="#737373" />
                </div>
              }
              title={
                <Typography variant="paragraph-small-bold" className="tracking-tight">
                  Other pending changes
                </Typography>
              }
            >
              <div className="flex flex-col gap-2">
                {untypedPending.map((row) => (
                  <PendingEntry
                    key={row.pending.configureRoot}
                    row={row}
                    safe={safe}
                    onOpenDetail={onOpenDetail}
                    onApply={onApply}
                  />
                ))}
              </div>
            </Section>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

/**
 * Policies, grouped the way they are enforced: per Safe.
 *
 * A policy applies to one Safe, and CGW reports the catalogue, the configured policies
 * and the pending requests per Safe — so the page leads with the Safe and nests the
 * policy types under it, instead of asking the user to pick a policy and then a Safe.
 * Each type shows its state and its entries; the fallback access gets its own group
 * because only one policy can occupy it.
 */
const PoliciesBySafe = (): ReactElement | null => {
  const { allSafes, isLoading } = useSpaceSafes()
  const safes = useMemo(() => flattenSafes(allSafes), [allSafes])
  const [openDetail, setOpenDetail] = useState<OpenDetail | null>(null)

  if (safes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-4.5 py-3.5">
        <Typography variant="paragraph-small" className="text-muted-foreground">
          {isLoading ? 'Loading Safes…' : 'Add a Safe to this space to configure policies.'}
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex max-w-[1040px] flex-col gap-5">
      {safes.map((safe) => (
        <Fragment key={safeRefKey(safe)}>
          <SafePolicyCard safe={safe} onOpenDetail={setOpenDetail} />
        </Fragment>
      ))}

      <PolicyDetailDrawer
        policy={openDetail?.detail ?? null}
        request={openDetail?.request}
        isFallback={openDetail?.isFallback}
        onClose={() => setOpenDetail(null)}
      />
    </div>
  )
}

export default PoliciesBySafe
