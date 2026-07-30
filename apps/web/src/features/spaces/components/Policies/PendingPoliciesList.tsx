import { Fragment, useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import { Button, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material'
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
import { encodeApplyConfiguration } from './shared/guardTx'

/**
 * A row = what CGW reports as pending, plus the requester's local snapshot when this
 * browser is the one that requested it. The snapshot is the only source of the
 * `Configuration[]` that `applyConfiguration` replays — CGW returns just the root.
 */
type PendingRow = { pending: PendingPolicy; local?: PolicyRequest }

const sameRoot = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

const guardOf = (row: PendingRow): string | undefined => {
  const enforcement = row.local?.enforcement ?? row.pending.policy?.enforcement
  return enforcement?.via === 'guard' ? enforcement.guards.transactionGuard?.safePolicyGuard : undefined
}

const describe = (row: PendingRow): { label: string; summary: string } => {
  if (row.pending.policy) {
    return { label: labelOf(row.pending.policy.type), summary: summarize(row.pending.policy) }
  }

  // CGW couldn't decode the root — fall back to what the requester stored locally.
  if (row.local) {
    const recipients = row.local.data.allowlist.reduce((n, entry) => n + entry.recipients.length, 0)
    return {
      label: labelOf(row.local.type),
      summary: `${row.local.data.allowlist.length} token(s) · ${recipients} recipient(s)`,
    }
  }

  return { label: 'Policy change', summary: '' }
}

const RequestRow = ({ row, onApply }: { row: PendingRow; onApply: (row: PendingRow) => void }) => {
  const { pending, local } = row
  const nowSec = Math.floor(Date.now() / 1000)
  // Trust CGW's verdict, but let the clock catch up between polls.
  const isReady = pending.isReady || nowSec >= pending.readyAt
  const hoursLeft = Math.max(0, Math.ceil((pending.readyAt - nowSec) / 3600))
  // Without the requester's Configuration[] there is nothing to replay on-chain.
  const canApply = isReady && !!local?.configurations.length && !!guardOf(row)
  const { label, summary } = describe(row)

  return (
    <Stack gap={1} sx={{ py: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}>
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
        {summary && <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{summary}</Typography>}
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} justifyContent="space-between">
        <Tooltip title={pending.configureRoot}>
          <Typography
            sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', cursor: 'default' }}
          >
            Root {shortenAddress(pending.configureRoot)}
          </Typography>
        </Tooltip>

        <Stack direction="row" alignItems="center" gap={1}>
          {isReady ? (
            <Chip size="small" color="success" variant="outlined" label="Ready to apply" />
          ) : (
            <Chip size="small" variant="outlined" label={`Ready in ~${hoursLeft}h`} />
          )}
          <Tooltip title={isReady && !canApply ? 'Cannot apply' : ''}>
            <span>
              <Button size="small" variant="contained" disabled={!canApply} onClick={() => onApply(row)}>
                Apply
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Stack>
  )
}

const SafePendingPolicies = ({ safe }: { safe: SafeRef }) => {
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
    const guard = guardOf(row)
    if (!guard || !row.local) return

    const tx = encodeApplyConfiguration(guard as Address, row.local.configurations)

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
        <RequestRow key={row.pending.configureRoot} row={row} onApply={onApply} />
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

  if (flatSafes.length === 0) return null

  return (
    <Stack gap={1.5} sx={{ maxWidth: 1040, mb: 4 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
        Pending policies
      </Typography>
      {flatSafes.map((safe) => (
        <Fragment key={safeRefKey(safe)}>
          <SafePendingPolicies safe={safe} />
        </Fragment>
      ))}
    </Stack>
  )
}

export default PendingPoliciesList
