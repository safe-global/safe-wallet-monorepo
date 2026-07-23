import { Fragment, useMemo } from 'react'
import { Paper, Stack, Typography } from '@mui/material'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { ChainLogo, SafeIdenticon } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { useSpaceSafes } from '@/features/spaces'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { flattenSafes, safeRefKey, type SafeRef } from './safeRefs'
import { useActivePolicies } from './useActivePolicies'

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

const PolicyRow = ({ policy }: { policy: ActivePolicy }) => (
  <Stack direction="row" alignItems="center" gap={1.5} sx={{ py: 1 }}>
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
    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{summarize(policy)}</Typography>
  </Stack>
)

const SafePolicies = ({ safe }: { safe: SafeRef }) => {
  const contact = useAddressBookItem(safe.address, safe.chainId)
  const { policies, isLoading, isError } = useActivePolicies(safe.chainId, safe.address)

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

      {policies.map((policy) => (
        <PolicyRow key={policy.id} policy={policy} />
      ))}
    </Paper>
  )
}

/**
 * API-backed read view of the policies configured across the space's Safes.
 * Renders one card per Safe that has ≥1 active policy, all types read-only.
 * Additive: sits alongside the existing on-chain AppliedPolicies until the
 * on-chain path is retired.
 */
const ActivePoliciesList = () => {
  const { allSafes } = useSpaceSafes()
  const flatSafes = useMemo(() => flattenSafes(allSafes), [allSafes])

  if (flatSafes.length === 0) return null

  return (
    <Stack gap={1.5} sx={{ maxWidth: 1040 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
        Active policies (API)
      </Typography>
      {flatSafes.map((safe) => (
        <Fragment key={safeRefKey(safe)}>
          <SafePolicies safe={safe} />
        </Fragment>
      ))}
    </Stack>
  )
}

export default ActivePoliciesList
