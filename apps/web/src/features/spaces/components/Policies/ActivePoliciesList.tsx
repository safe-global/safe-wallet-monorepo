import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { ChevronRight, RefreshCw } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { ChainLogo, SafeIdenticon } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { useSpaceSafes } from '@/features/spaces'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { flattenSafes, safeRefKey, type SafeRef } from './safeRefs'
import { useActivePolicies } from './useActivePolicies'
import PolicyDetailDrawer, { type PolicyDetail } from './PolicyDetailDrawer'

const POLICY_LABEL: Record<PolicyType, string> = {
  [PolicyType.SpendingLimit]: 'Spending limit',
  [PolicyType.Recovery]: 'Account recovery',
  [PolicyType.TokenWithdraw]: 'Token withdraw allowlist',
  [PolicyType.Cosigner]: 'Cosigner',
}

const summarize = (policy: ActivePolicy): string => {
  switch (policy.type) {
    case PolicyType.SpendingLimit:
      return `Spender ${shortenAddress(policy.data.beneficiary)} · ${policy.data.limits.length} token limit(s)`
    case PolicyType.Recovery:
      return `${policy.data.recoverers.length} recoverer(s)`
    case PolicyType.TokenWithdraw: {
      const recipients = policy.data.allowlist.reduce((n, entry) => n + entry.recipients.length, 0)
      return `${policy.data.allowlist.length} token(s) · ${recipients} allowed recipient(s)`
    }
    case PolicyType.Cosigner:
      return `${policy.data.rules.length} cosigner rule(s)`
  }
}

/** Map an API active policy to the drawer's detail shape (best-effort per type). */
const toDetail = (policy: ActivePolicy, safe: SafeRef): PolicyDetail | null => {
  switch (policy.type) {
    case PolicyType.SpendingLimit:
      return {
        type: 'spending-limit',
        beneficiary: policy.data.beneficiary,
        safe,
        limits: policy.data.limits.map((l) => ({
          beneficiary: policy.data.beneficiary,
          token: { address: l.token.address, symbol: l.token.symbol, decimals: l.token.decimals },
          amount: l.amount,
          spent: l.spent,
          nonce: l.nonce,
          resetTimeMin: '0',
          lastResetMin: '0',
        })),
      }
    case PolicyType.Recovery:
      return {
        type: 'recovery',
        recoverer: policy.data.recoverers[0] ?? '',
        safe,
        config: {
          delayModifierAddress: policy.enforcement.via === 'module' ? policy.enforcement.moduleAddress : '',
          recoverers: policy.data.recoverers,
          cooldownSec: BigInt(policy.data.cooldownSec || '0'),
          expirySec: BigInt(policy.data.expirySec || '0'),
        },
      }
    case PolicyType.TokenWithdraw:
      return {
        type: 'ERC20TransferPolicy',
        safe,
        allowlist: policy.data.allowlist.map((entry) => ({
          token: { address: entry.token.address, symbol: entry.token.symbol },
          recipients: entry.recipients,
        })),
      }
    // No dedicated drawer view for cosigner yet.
    case PolicyType.Cosigner:
      return null
  }
}

const PolicyRow = ({ policy, onOpen }: { policy: ActivePolicy; onOpen?: () => void }) => (
  <Stack
    direction="row"
    alignItems="center"
    gap={1.5}
    role={onOpen ? 'button' : undefined}
    tabIndex={onOpen ? 0 : undefined}
    onClick={onOpen}
    onKeyDown={(e) => {
      if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onOpen()
      }
    }}
    sx={{
      py: 1,
      px: 1,
      mx: -1,
      borderRadius: '10px',
      cursor: onOpen ? 'pointer' : 'default',
      transition: 'background-color 150ms ease',
      '&:hover': onOpen ? { backgroundColor: 'background.main' } : undefined,
      '&:hover .policy-row-chevron': { transform: 'translateX(2px)' },
    }}
  >
    <Typography
      sx={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: 'success.dark',
        minWidth: 150,
      }}
    >
      {POLICY_LABEL[policy.type]}
    </Typography>
    <Typography sx={{ fontSize: 13, color: 'text.secondary', flex: 1 }}>{summarize(policy)}</Typography>
    {onOpen && (
      <ChevronRight
        size={16}
        className="policy-row-chevron"
        color="#A1A3A7"
        style={{ transition: 'transform 150ms ease' }}
      />
    )}
  </Stack>
)

type SafePoliciesProps = {
  safe: SafeRef
  onCountChange: (key: string, count: number) => void
  onOpenDetail: (detail: PolicyDetail) => void
}

const SafePolicies = ({ safe, onCountChange, onOpenDetail }: SafePoliciesProps) => {
  const contact = useAddressBookItem(safe.address, safe.chainId)
  const { policies, isLoading, isError } = useActivePolicies(safe.chainId, safe.address)

  const key = safeRefKey(safe)
  const count = isLoading || isError ? 0 : policies.length
  // Report the resolved count up so the header total stays in sync.
  useEffect(() => onCountChange(key, count), [key, count, onCountChange])

  if (isLoading || isError || policies.length === 0) return null

  const name = contact?.name || safe.name

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <SafeIdenticon address={safe.address} size={20} />
        {name && <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{name}</Typography>}
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {shortenAddress(safe.address)}
        </Typography>
        <ChainLogo chainId={safe.chainId} size={16} />
      </Stack>

      {policies.map((policy) => {
        const detail = toDetail(policy, safe)
        return <PolicyRow key={policy.id} policy={policy} onOpen={detail ? () => onOpenDetail(detail) : undefined} />
      })}
    </Paper>
  )
}

/**
 * The space's configured policies, read from the CGW policy engine API. One card
 * per Safe with ≥1 active policy; each row opens a detail drawer, with a header
 * count + refresh. This is the single Active-policies list (it replaced the
 * legacy on-chain scanner).
 */
const ActivePoliciesList = () => {
  const { allSafes } = useSpaceSafes()
  const flatSafes = useMemo(() => flattenSafes(allSafes), [allSafes])

  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [openDetail, setOpenDetail] = useState<PolicyDetail | null>(null)
  // Bumping this remounts the children, re-issuing the queries.
  const [refreshNonce, setRefreshNonce] = useState(0)

  const onCountChange = useCallback((key: string, count: number) => {
    setCounts((prev) => {
      if (prev.get(key) === count) return prev
      const next = new Map(prev)
      next.set(key, count)
      return next
    })
  }, [])

  const onRefresh = useCallback(() => {
    setCounts(new Map())
    setRefreshNonce((n) => n + 1)
  }, [])

  const total = useMemo(() => Array.from(counts.values()).reduce((a, b) => a + b, 0), [counts])

  if (flatSafes.length === 0) return null

  return (
    <Stack gap={1.5} sx={{ maxWidth: 1040 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
          Active policies
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {total}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Refresh policies" placement="top">
          <IconButton
            size="small"
            onClick={onRefresh}
            aria-label="Refresh policies"
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' }, transition: 'color 150ms ease' }}
          >
            <RefreshCw size={13} style={{ display: 'block' }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {flatSafes.map((safe) => (
        <Fragment key={`${safeRefKey(safe)}:${refreshNonce}`}>
          <SafePolicies safe={safe} onCountChange={onCountChange} onOpenDetail={setOpenDetail} />
        </Fragment>
      ))}

      {total === 0 && (
        <Paper
          elevation={0}
          sx={{ padding: '14px 18px', borderRadius: '14px', border: '1px dashed rgba(0, 0, 0, 0.08)' }}
        >
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            No policies applied to the {flatSafes.length} {flatSafes.length === 1 ? 'safe' : 'safes'} in this space yet.
          </Typography>
        </Paper>
      )}

      <PolicyDetailDrawer policy={openDetail} onClose={() => setOpenDetail(null)} />
    </Stack>
  )
}

export default ActivePoliciesList
