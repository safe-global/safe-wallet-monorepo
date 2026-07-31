import { Fragment, useId, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Ban,
  ChevronDown,
  ChevronRight,
  Coins,
  LifeBuoy,
  Plus,
  Shield,
  ShieldCheck,
  ShieldOff,
  WalletMinimal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  PolicyType,
  type ActivePolicy,
  type AvailablePolicy,
  type PendingPolicy,
} from '@safe-global/store/gateway/policies/types'
import { AppRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { ChainLogo, SafeIdenticon } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useSpaceSafes } from '@/features/spaces'
import { flattenSafes, safeRefKey, type SafeRef } from './safeRefs'
import { entryLabelOf, entrySummaryOf, labelOf, tokensOf } from './policyLabels'
import { isFallbackAccess, isFallbackPolicyId } from './policyAccess'
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
  <Stack
    direction="row"
    alignItems="center"
    gap={1.25}
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
    sx={{
      py: 1.25,
      px: 1.25,
      borderRadius: '12px',
      backgroundColor: 'background.main',
      cursor: 'pointer',
      transition: 'background-color 150ms ease',
      '&:hover': { backgroundColor: 'secondary.background' },
      '&:hover .entry-chevron': { transform: 'translateX(2px)' },
    }}
  >
    <Box sx={{ minWidth: 0, maxWidth: '45%' }}>{label}</Box>
    {badges}
    {summary && (
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', flex: 1, minWidth: 0 }} noWrap>
        {summary}
      </Typography>
    )}
    <Box sx={{ flex: summary ? 0 : 1 }} />
    {action}
    <ChevronRight size={16} className="entry-chevron" color="#A1A3A7" style={{ transition: 'transform 150ms ease' }} />
  </Stack>
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
  const isFallback = isFallbackPolicyId(policy.id)
  const tokens = tokensOf(policy)
  const scope = entryLabelOf(policy)

  return (
    <EntryRow
      ariaLabel={scope}
      label={
        tokens.length > 0 ? (
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
            {tokens.slice(0, MAX_TOKEN_BADGES).map((token) => (
              <TokenBadge key={token.address} token={token} />
            ))}
            {tokens.length > MAX_TOKEN_BADGES && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                +{tokens.length - MAX_TOKEN_BADGES}
              </Typography>
            )}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 13, fontWeight: 700 }} noWrap>
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
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
            {tokens.slice(0, MAX_TOKEN_BADGES).map((token) => (
              <TokenBadge key={token.address} token={token} />
            ))}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 13, fontWeight: 700 }} noWrap>
            {scope}
          </Typography>
        )
      }
      summary={`Root ${shortenAddress(row.pending.configureRoot)}`}
      badges={hasFallbackAccess(row) ? <FallbackBadge /> : undefined}
      action={
        <Stack direction="row" alignItems="center" gap={1} onClick={(e) => e.stopPropagation()}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{status}</Typography>
          <Tooltip title={blockedMessage}>
            <span>
              <Button size="sm" disabled={!plan.canApply} onClick={() => onApply(row)}>
                Apply
              </Button>
            </span>
          </Tooltip>
        </Stack>
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
    <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        onClick={() => setOpen((v) => !v)}
        sx={{ minHeight: 60, py: 0.5, cursor: 'pointer' }}
      >
        {icon}
        {title}
        {meta}

        <Box sx={{ flex: 1 }} />

        {action && <Box onClick={(e) => e.stopPropagation()}>{action}</Box>}

        <IconButton
          size="small"
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
            style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 150ms ease' }}
          />
        </IconButton>
      </Stack>

      <Collapse in={open} unmountOnExit>
        {/* Indented to the section title, so entries read as belonging to it. */}
        <Box id={contentId} sx={{ pb: 2.5, pl: { xs: 0, sm: 5.25 } }}>
          {children}
        </Box>
      </Collapse>
    </Box>
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
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '9px',
            backgroundColor: 'secondary.background',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={15} color="#1C5538" />
        </Box>
      }
      title={
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.1px' }} noWrap>
          {entry.title || labelOf(entry.type)}
        </Typography>
      }
      action={
        <Tooltip title={blocked}>
          <span>
            <Button variant="outline" size="sm" disabled={!!blocked} onClick={() => onAdd(entry.type)}>
              <Plus size={14} /> Add
            </Button>
          </span>
        </Tooltip>
      }
    >
      <Stack gap={1}>
        {entry.description && (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 0.5 }}>{entry.description}</Typography>
        )}

        {active.map((policy) => (
          <ActiveEntry key={policy.id} policy={policy} safe={safe} onOpenDetail={onOpenDetail} />
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
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontStyle: 'italic' }}>
            {blocked || 'Not configured on this Safe yet.'}
          </Typography>
        )}
      </Stack>
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
    <Stack direction="row" alignItems="center" gap={1.25} sx={{ py: 0.75, px: 1.25 }}>
      <Icon size={15} color="#737373" />
      <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
        {entry.title || labelOf(entry.type)}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', flex: 1, minWidth: 0 }} noWrap>
        {entry.description}
      </Typography>
      <Tooltip title={blocked}>
        <span>
          <Button variant="outline" size="sm" disabled={!!blocked} onClick={() => onAdd(entry.type)}>
            <Plus size={14} /> Add
          </Button>
        </span>
      </Tooltip>
    </Stack>
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
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '9px',
            backgroundColor: 'background.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Shield size={15} color="#737373" />
        </Box>
      }
      title={<Typography sx={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.1px' }}>Fallback</Typography>}
      meta={
        <>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>only one applies at a time</Typography>
        </>
      }
    >
      <Stack gap={1}>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 0.5 }}>
          Covers any transaction no other policy matches. Installing one replaces the current fallback.
        </Typography>

        {active.map((policy) => (
          <ActiveEntry key={policy.id} policy={policy} safe={safe} onOpenDetail={onOpenDetail} />
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
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontStyle: 'italic' }}>
            No fallback policy on this Safe.
          </Typography>
        )}

        {/* The choices for this slot, from the catalogue's `isFallback` entries. */}
        {catalogue.map((entry) => (
          <FallbackChoiceRow key={entry.type} entry={entry} onAdd={onAdd} />
        ))}
      </Stack>
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
    const isFallbackActive = (policy: ActivePolicy) => isFallbackPolicyId(policy.id)

    return {
      fallbackActive: active.filter(isFallbackActive),
      fallbackPending: pendingRows.filter(hasFallbackAccess),
      specificActive: active.filter((policy) => !isFallbackActive(policy)),
      specificPending: pendingRows.filter((row) => !hasFallbackAccess(row)),
    }
  }, [active, pendingRows])

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

  return (
    <Accordion
      defaultExpanded
      disableGutters
      elevation={0}
      square
      sx={{
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary expandIcon={<ChevronDown size={20} color="#A1A3A7" />} sx={{ px: 2.5, minHeight: 76 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1, minWidth: 0, pr: 2 }}>
          <SafeIdenticon address={safe.address} size={36} />

          <Stack sx={{ minWidth: 0 }}>
            {name && (
              <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.25 }} noWrap>
                {name}
              </Typography>
            )}
            <Stack direction="row" alignItems="center" gap={0.75}>
              <Typography sx={{ fontSize: 13.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }} noWrap>
                {shortenAddress(safe.address)}
              </Typography>
              <ChainLogo chainId={safe.chainId} size={14} />
            </Stack>
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontWeight: 600 }}>
            {active.length} active {active.length === 1 ? 'policy' : 'policies'}
            {pendingRows.length > 0 ? ` · ${pendingRows.length} pending` : ''}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 1.5 }}>
        {catalogue.length === 0 && !catalogueLoading ? (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
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
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '9px',
                  backgroundColor: 'background.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Shield size={15} color="#737373" />
              </Box>
            }
            title={
              <Typography sx={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.1px' }}>
                Other pending changes
              </Typography>
            }
          >
            <Stack gap={1}>
              {untypedPending.map((row) => (
                <PendingEntry
                  key={row.pending.configureRoot}
                  row={row}
                  safe={safe}
                  onOpenDetail={onOpenDetail}
                  onApply={onApply}
                />
              ))}
            </Stack>
          </Section>
        )}
      </AccordionDetails>
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
      <Paper elevation={0} sx={{ padding: '14px 18px', borderRadius: '14px', border: '1px dashed rgba(0,0,0,0.08)' }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {isLoading ? 'Loading Safes…' : 'Add a Safe to this space to configure policies.'}
        </Typography>
      </Paper>
    )
  }

  return (
    <Stack gap={2.5} sx={{ maxWidth: 1040 }}>
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
    </Stack>
  )
}

export default PoliciesBySafe
