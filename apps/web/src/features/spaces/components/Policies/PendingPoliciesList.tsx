import { Fragment, useContext, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Button, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { ChevronRight } from 'lucide-react'
import type { Address } from 'viem'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { PendingPolicy } from '@safe-global/store/gateway/policies/types'
import { ChainLogo, SafeIdenticon } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import useChains from '@/hooks/useChains'
import { useSpaceSafes } from '@/features/spaces'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import { flattenSafes, safeRefKey, type SafeRef } from './safeRefs'
import { usePolicyRequests, type PolicyRequest } from './policyRequestStore'
import { usePendingPolicies } from './hooks/usePendingPolicies'
import { labelOf, summarize } from './policyLabels'
import { toPendingDetail } from './policyDetails'
import { isFallbackAccess } from './policyAccess'
import { FallbackBadge } from './shared/FallbackBadge'
import PolicyDetailDrawer, { type PendingRequestInfo, type PolicyDetail } from './PolicyDetailDrawer'
import { encodeApplyConfiguration } from './shared/guardTx'
import { APPLY_BLOCKED_MESSAGE, resolveApplyPlan, type ApplyPlan } from './shared/applyPlan'
import { logError, Errors } from '@/services/exceptions'

/**
 * A row = what CGW reports as pending, plus the requester's local snapshot when this
 * browser is the one that requested it. CGW's bindings are the source that works for
 * any signer; the snapshot only helps the device that made the request.
 */
type PendingRow = { pending: PendingPolicy; local?: PolicyRequest }

const sameRoot = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** The guard a locally-stored request was made against. */
const localGuardOf = (local: PolicyRequest | undefined): string | undefined =>
  local?.enforcement.via === 'guard' ? local.enforcement.guards.transactionGuard?.safePolicyGuard : undefined

/**
 * Whether the requested change touches the guard's catch-all access. Read from CGW's
 * bindings when it serves them, else from the requester's own configurations.
 */
const hasFallbackAccess = (row: PendingRow): boolean => {
  const bindings = row.pending.policies
  if (bindings?.length) return bindings.some(isFallbackAccess)

  return !!row.local?.configurations.some(isFallbackAccess)
}

const describe = (row: PendingRow): { label: string; summary: string } => {
  if (row.pending.policy) {
    return { label: labelOf(row.pending.policy.type), summary: summarize(row.pending.policy) }
  }

  // CGW served the bindings but not a decoded policy — say how many there are.
  if (row.pending.policies?.length) {
    const count = row.pending.policies.length
    return { label: 'Policy change', summary: `${count} ${count === 1 ? 'binding' : 'bindings'}` }
  }

  // Nothing from CGW — fall back to what the requester stored locally.
  if (row.local) {
    const recipients = row.local.data.allowlist.reduce((n, entry) => n + entry.recipients.length, 0)
    return {
      label: labelOf(row.local.type),
      summary: `${row.local.data.allowlist.length} token(s) · ${recipients} recipient(s)`,
    }
  }

  return { label: 'Policy change', summary: '' }
}

/** Whether this row can be applied, and with which payload. */
const applyPlanOf = (row: PendingRow, nowSec: number): ApplyPlan =>
  resolveApplyPlan({
    pending: row.pending,
    local: row.local ? { configurations: row.local.configurations, guard: localGuardOf(row.local) } : undefined,
    nowSec,
  })

type RequestRowProps = {
  row: PendingRow
  onApply: (row: PendingRow) => void
  onOpenDetail: (row: PendingRow) => void
}

const RequestRow = ({ row, onApply, onOpenDetail }: RequestRowProps) => {
  const { pending } = row
  const nowSec = Math.floor(Date.now() / 1000)
  // Trust CGW's verdict, but let the clock catch up between polls.
  const isReady = pending.isReady || nowSec >= pending.readyAt
  const hoursLeft = Math.max(0, Math.ceil((pending.readyAt - nowSec) / 3600))
  const plan = applyPlanOf(row, nowSec)
  const blockedMessage = plan.canApply ? '' : APPLY_BLOCKED_MESSAGE[plan.reason]
  const { label, summary } = describe(row)

  return (
    <Stack
      gap={1}
      role="button"
      tabIndex={0}
      aria-label={`${label} details`}
      onClick={() => onOpenDetail(row)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDetail(row)
        }
      }}
      sx={{
        py: 1.5,
        px: 1,
        mx: -1,
        borderTop: '1px solid rgba(0, 0, 0, 0.04)',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'background-color 150ms ease',
        '&:hover': { backgroundColor: 'background.main' },
        '&:hover .pending-row-chevron': { transform: 'translateX(2px)' },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: 'warning.main',
            minWidth: 150,
          }}
        >
          {label}
        </Typography>
        {hasFallbackAccess(row) && <FallbackBadge />}
        {summary && <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{summary}</Typography>}
        <Box sx={{ flex: 1 }} />
        <ChevronRight
          size={16}
          className="pending-row-chevron"
          color="#A1A3A7"
          style={{ transition: 'transform 150ms ease' }}
        />
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} justifyContent="space-between">
        <Tooltip title={pending.configureRoot}>
          <Typography
            sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', cursor: 'default' }}
          >
            Root {shortenAddress(pending.configureRoot)}
          </Typography>
        </Tooltip>

        <Stack direction="row" alignItems="center" gap={1} onClick={(e) => e.stopPropagation()}>
          {isReady ? (
            <Chip size="small" color="success" variant="outlined" label="Ready to apply" />
          ) : (
            <Chip size="small" variant="outlined" label={`Ready in ~${hoursLeft}h`} />
          )}
          <Tooltip title={blockedMessage}>
            <span>
              <Button size="small" variant="contained" disabled={!plan.canApply} onClick={() => onApply(row)}>
                Apply
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Stack>
  )
}

const SafePendingPolicies = ({
  safe,
  onOpenDetail,
}: {
  safe: SafeRef
  onOpenDetail: (detail: PolicyDetail, request: PendingRequestInfo, isFallback: boolean) => void
}) => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { setTxFlow } = useContext(TxModalContext)
  const contact = useAddressBookItem(safe.address, safe.chainId)
  const { policies: pending, refetch } = usePendingPolicies(safe.chainId, safe.address)
  const { requests, remove } = usePolicyRequests(safe.chainId, safe.address)

  const rows = useMemo<PendingRow[]>(
    () =>
      pending.map((item) => ({
        pending: item,
        local: requests.find((request) => sameRoot(request.configureRoot, item.configureRoot)),
      })),
    [pending, requests],
  )

  if (rows.length === 0) return null

  const name = contact?.name || safe.name

  const onApply = async (row: PendingRow) => {
    const plan = applyPlanOf(row, Math.floor(Date.now() / 1000))
    if (!plan.canApply) {
      // The row's Apply is disabled in this state; log if it's reached anyway.
      if (plan.reason === 'root-mismatch') logError(Errors._823, `configureRoot ${row.pending.configureRoot}`)
      return
    }

    const tx = encodeApplyConfiguration(plan.guard as Address, plan.configurations)

    // Point the app at this Safe so the tx-flow SDK/useSafeInfo resolve it, then
    // hand off the applyConfiguration tx. On success, drop the local snapshot and
    // re-read the pending list from CGW.
    const chain = chains.find((c) => c.chainId === safe.chainId)
    if (chain) {
      await router.replace(
        { pathname: router.pathname, query: { ...router.query, safe: `${chain.shortName}:${safe.address}` } },
        undefined,
        { shallow: true },
      )
    }

    setTxFlow(
      <PolicyBatchFlow
        txs={[tx]}
        subtitle="Apply token withdraw change"
        onSubmit={(args) => {
          if (!args?.txId) return
          if (row.local) remove(row.local.id)
          refetch()
        }}
      />,
    )
  }

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
      <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
        <SafeIdenticon address={safe.address} size={20} />
        {name && <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{name}</Typography>}
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {shortenAddress(safe.address)}
        </Typography>
        <ChainLogo chainId={safe.chainId} size={16} />
      </Stack>

      {rows.map((row) => (
        <RequestRow
          key={row.pending.configureRoot}
          row={row}
          onApply={onApply}
          onOpenDetail={(clicked) =>
            onOpenDetail(
              toPendingDetail({ pending: clicked.pending, local: clicked.local, safe }),
              {
                configureRoot: clicked.pending.configureRoot,
                requestedAt: clicked.pending.requestedAt,
                readyAt: clicked.pending.readyAt,
                isReady: clicked.pending.isReady,
              },
              hasFallbackAccess(clicked),
            )
          }
        />
      ))}
    </Paper>
  )
}

/**
 * Pending policy changes across the space's Safes — requested on-chain but not yet
 * applied (waiting out the SafePolicyGuard delay). Read from the CGW pending
 * endpoint; the locally stored request snapshot supplies the `Configuration[]` the
 * Apply transaction replays, matched to a CGW row by `configureRoot`.
 */
const PendingPoliciesList = () => {
  const { allSafes } = useSpaceSafes()
  const flatSafes = useMemo(() => flattenSafes(allSafes), [allSafes])
  const [openDetail, setOpenDetail] = useState<{
    detail: PolicyDetail
    request: PendingRequestInfo
    isFallback: boolean
  } | null>(null)

  if (flatSafes.length === 0) return null

  return (
    <Stack gap={1.5} sx={{ maxWidth: 1040, mb: 4 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
        Pending policies
      </Typography>
      {flatSafes.map((safe) => (
        <Fragment key={safeRefKey(safe)}>
          <SafePendingPolicies
            safe={safe}
            onOpenDetail={(detail, request, isFallback) => setOpenDetail({ detail, request, isFallback })}
          />
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

export default PendingPoliciesList
