import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { ChevronRight, RefreshCw } from 'lucide-react'
import { safeFormatUnits, shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  ChainLogo,
  SafeIdenticon,
  ShortAddressWithTooltip,
} from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { useSpaceSafes } from '@/features/spaces'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { isMultiChainSafeItem } from '@/hooks/safes/useAllSafesGrouped'
import type { SpendingLimitState } from '@/features/spending-limits/types'
import { useSafeSpendingLimits } from './useSafeSpendingLimits'
import { useSafeRecovery, type SafeRecoveryConfig } from './useSafeRecovery'
import PolicyDetailDrawer, { type PolicyDetail } from './PolicyDetailDrawer'

type SafeRef = { chainId: string; address: string; name: string }

const flattenSafes = (safesGrouped: ReturnType<typeof useSpaceSafes>['allSafes']): SafeRef[] => {
  const out: SafeRef[] = []
  for (const item of safesGrouped ?? []) {
    if (isMultiChainSafeItem(item)) {
      for (const s of item.safes) {
        out.push({ chainId: s.chainId, address: s.address, name: item.name || s.name || '' })
      }
    } else {
      out.push({ chainId: item.chainId, address: item.address, name: item.name || '' })
    }
  }
  return out
}

const safeKey = (s: SafeRef) => `${s.chainId}:${s.address.toLowerCase()}`

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

const resetPeriodLabel = (resetTimeMin: string): string => {
  if (resetTimeMin === '0') return 'one-time'
  const min = Number(resetTimeMin)
  if (!Number.isFinite(min) || min <= 0) return 'one-time'
  if (min === 1440) return 'daily'
  if (min === 10080) return 'weekly'
  if (min === 43200) return 'monthly'
  const days = Math.round(min / 1440)
  return `every ${days} ${days === 1 ? 'day' : 'days'}`
}

const ActivePill = () => (
  <Stack
    direction="row"
    alignItems="center"
    gap={0.5}
    sx={{
      padding: '3px 8px',
      borderRadius: '9999px',
      backgroundColor: 'secondary.background',
      color: 'success.dark',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      flexShrink: 0,
    }}
  >
    <Box
      sx={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        backgroundColor: 'secondary.main',
        animation: 'policyActivePulse 2.2s ease-in-out infinite',
        '@keyframes policyActivePulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(18, 255, 128, 0.55)' },
          '50%': { boxShadow: '0 0 0 5px rgba(18, 255, 128, 0)' },
        },
      }}
    />
    Active
  </Stack>
)

const PolicyTag = ({ label, color }: { label: string; color: string }) => (
  <Typography
    sx={{
      fontSize: 10,
      fontWeight: 700,
      color,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    }}
  >
    {label}
  </Typography>
)

type SafeMetaProps = {
  safe: SafeRef
  shortName: string
}

const SafeMeta = ({ safe, shortName }: SafeMetaProps) => (
  <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', letterSpacing: '0.2px', flexShrink: 0 }}>
      Safe:
    </Typography>
    <SafeIdenticon address={safe.address} size={14} />
    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>
      {safe.name || 'Safe'}
    </Typography>
    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontFamily: 'ui-monospace, monospace' }}>
      {shortName ? `${shortName}:` : ''}
      {shortenAddress(safe.address)}
    </Typography>
    <ChainLogo chainId={safe.chainId} size={14} />
  </Stack>
)

type RowFrameProps = {
  policyTag: { label: string; color: string }
  onClick: () => void
  beneficiaryAddress: string
  beneficiaryName?: string
  chainId: string
  safe: SafeRef
  shortName: string
  detail: React.ReactNode
}

const RowFrame = ({
  policyTag,
  onClick,
  beneficiaryAddress,
  beneficiaryName,
  safe,
  shortName,
  detail,
}: RowFrameProps) => (
  <Paper
    elevation={0}
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }}
    sx={{
      display: 'block',
      padding: '14px 18px',
      borderRadius: '14px',
      border: '1px solid rgba(0, 0, 0, 0.03)',
      color: 'text.primary',
      cursor: 'pointer',
      transition: 'background-color 150ms ease, border-color 150ms ease',
      '&:hover': {
        backgroundColor: 'background.main',
        borderColor: 'rgba(0, 0, 0, 0.06)',
      },
      '&:hover .policy-row-chevron': {
        transform: 'translateX(2px)',
        color: 'text.primary',
      },
      '&:focus-visible': {
        outline: '2px solid',
        outlineColor: 'text.primary',
        outlineOffset: '2px',
      },
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
      <PolicyTag {...policyTag} />
      <Stack direction="row" alignItems="center" gap={1}>
        <ActivePill />
        <ChevronRight
          size={16}
          className="policy-row-chevron"
          color="#A1A3A7"
          style={{ transition: 'transform 150ms ease, color 150ms ease' }}
        />
      </Stack>
    </Stack>

    <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 0.75 }}>
      <SafeIdenticon address={beneficiaryAddress} size={28} />
      <Stack sx={{ minWidth: 0 }}>
        {beneficiaryName && (
          <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{beneficiaryName}</Typography>
        )}
        <ShortAddressWithTooltip address={beneficiaryAddress} />
      </Stack>
    </Stack>

    <SafeMeta safe={safe} shortName={shortName} />

    {detail}
  </Paper>
)

type SpendingLimitGroupProps = {
  safe: SafeRef
  shortName: string
  beneficiary: string
  limits: SpendingLimitState[]
  onOpenDetail: () => void
}

const SpendingLimitGroup = ({ safe, shortName, beneficiary, limits, onOpenDetail }: SpendingLimitGroupProps) => {
  const contact = useAddressBookItem(beneficiary, safe.chainId)

  const summary = useMemo(() => {
    return limits
      .map((l) => {
        const amount = safeFormatUnits(BigInt(l.amount), l.token.decimals)
        const symbol = l.token.symbol || '?'
        return `${amount} ${symbol} ${resetPeriodLabel(l.resetTimeMin)}`
      })
      .join(' · ')
  }, [limits])

  return (
    <RowFrame
      policyTag={{ label: 'Spending Limit', color: 'success.dark' }}
      onClick={onOpenDetail}
      beneficiaryAddress={beneficiary}
      beneficiaryName={contact?.name}
      chainId={safe.chainId}
      safe={safe}
      shortName={shortName}
      detail={
        <Typography
          sx={{
            fontSize: 11.5,
            color: 'text.secondary',
            mt: 0.75,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.5,
          }}
        >
          {limits.length > 0 ? (
            <>
              <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>
                Limit:
              </Box>
              {summary}
            </>
          ) : (
            <Box component="span" sx={{ fontStyle: 'italic' }}>
              No active token limits — setup may be pending execution.
            </Box>
          )}
        </Typography>
      }
    />
  )
}

type RecoveryRowProps = {
  safe: SafeRef
  shortName: string
  config: SafeRecoveryConfig
  recoverer: string
  onOpenDetail: () => void
}

const RecoveryRow = ({ safe, shortName, config, recoverer, onOpenDetail }: RecoveryRowProps) => {
  const contact = useAddressBookItem(recoverer, safe.chainId)
  const cooldownLabel = formatDuration(config.cooldownSec)
  const expiryLabel = config.expirySec === 0n ? 'never expires' : `expires after ${formatDuration(config.expirySec)}`

  return (
    <RowFrame
      policyTag={{ label: 'Account Recovery', color: 'success.dark' }}
      onClick={onOpenDetail}
      beneficiaryAddress={recoverer}
      beneficiaryName={contact?.name}
      chainId={safe.chainId}
      safe={safe}
      shortName={shortName}
      detail={
        <Typography
          sx={{
            fontSize: 11.5,
            color: 'text.secondary',
            mt: 0.75,
            lineHeight: 1.5,
          }}
        >
          <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>
            Cooldown:
          </Box>
          {cooldownLabel} · {expiryLabel}
        </Typography>
      }
    />
  )
}

const SafePolicies = ({
  safe,
  onPoliciesChange,
  onOpenDetail,
}: {
  safe: SafeRef
  onPoliciesChange: (key: string, count: number) => void
  onOpenDetail: (detail: PolicyDetail) => void
}) => {
  const { configs: chains } = useChains()
  const chain = useMemo(() => chains.find((c) => c.chainId === safe.chainId), [chains, safe.chainId])
  const shortName = chain?.shortName ?? ''

  const {
    limits,
    delegates,
    hasAllowanceModule,
    loading: spendingLoading,
  } = useSafeSpendingLimits(safe.chainId, safe.address)
  const { recovery, loading: recoveryLoading } = useSafeRecovery(safe.chainId, safe.address)

  // Group spending-limit entries by beneficiary so each spender becomes one row.
  const limitsByBeneficiary = useMemo(() => {
    const map = new Map<string, SpendingLimitState[]>()
    for (const l of limits) {
      const key = l.beneficiary.toLowerCase()
      const arr = map.get(key)
      if (arr) arr.push(l)
      else map.set(key, [l])
    }
    return map
  }, [limits])

  // Delegates that exist on-chain but didn't surface any token entries — render
  // a row per delegate so the user still sees who is configured, even if the
  // per-token fetch came back empty (e.g., setup tx hasn't executed yet).
  const delegatesWithoutTokens = useMemo(
    () => delegates.filter((d) => !limitsByBeneficiary.has(d.toLowerCase())),
    [delegates, limitsByBeneficiary],
  )

  const spendingRowCount = limitsByBeneficiary.size + delegatesWithoutTokens.length
  // Last-resort fallback: module installed but we couldn't list any delegates
  // at all. One row keyed by the Safe so the count and the list stay aligned.
  const spendingFallback = hasAllowanceModule && spendingRowCount === 0 && !spendingLoading

  const recoveryRowCount = recovery.reduce((acc, r) => acc + r.recoverers.length, 0)

  const key = safeKey(safe)
  useEffect(() => {
    if (spendingLoading || recoveryLoading) return
    const count = (spendingRowCount || (spendingFallback ? 1 : 0)) + recoveryRowCount
    onPoliciesChange(key, count)
  }, [key, spendingRowCount, spendingFallback, recoveryRowCount, spendingLoading, recoveryLoading, onPoliciesChange])

  return (
    <>
      {Array.from(limitsByBeneficiary.entries()).map(([beneficiary, beneficiaryLimits]) => (
        <SpendingLimitGroup
          key={`sl:${beneficiary}`}
          safe={safe}
          shortName={shortName}
          beneficiary={beneficiaryLimits[0].beneficiary}
          limits={beneficiaryLimits}
          onOpenDetail={() =>
            onOpenDetail({
              type: 'spending-limit',
              beneficiary: beneficiaryLimits[0].beneficiary,
              limits: beneficiaryLimits,
              safe,
            })
          }
        />
      ))}
      {delegatesWithoutTokens.map((delegate) => (
        <SpendingLimitGroup
          key={`sl-empty:${delegate}`}
          safe={safe}
          shortName={shortName}
          beneficiary={delegate}
          limits={[]}
          onOpenDetail={() => onOpenDetail({ type: 'spending-limit', beneficiary: delegate, limits: [], safe })}
        />
      ))}
      {/* Module installed but no per-spender data — render a minimal row keyed
          off the Safe itself, so the count and the visible list always agree. */}
      {spendingFallback && (
        <Paper
          elevation={0}
          role="button"
          tabIndex={0}
          onClick={() => onOpenDetail({ type: 'spending-limit', beneficiary: safe.address, limits: [], safe })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpenDetail({ type: 'spending-limit', beneficiary: safe.address, limits: [], safe })
            }
          }}
          sx={{
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1px solid rgba(0, 0, 0, 0.03)',
            cursor: 'pointer',
            transition: 'background-color 150ms ease, border-color 150ms ease',
            '&:hover': { backgroundColor: 'background.main', borderColor: 'rgba(0, 0, 0, 0.06)' },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'text.primary',
              outlineOffset: '2px',
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <PolicyTag label="Spending Limit" color="success.dark" />
            <Stack direction="row" alignItems="center" gap={1}>
              <ActivePill />
              <ChevronRight size={16} color="#A1A3A7" />
            </Stack>
          </Stack>
          <SafeMeta safe={safe} shortName={shortName} />
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.75, fontStyle: 'italic' }}>
            Module installed · spender details unavailable
          </Typography>
        </Paper>
      )}
      {recovery.flatMap((config) =>
        config.recoverers.map((recoverer) => (
          <RecoveryRow
            key={`rec:${config.delayModifierAddress}:${recoverer}`}
            safe={safe}
            shortName={shortName}
            config={config}
            recoverer={recoverer}
            onOpenDetail={() => onOpenDetail({ type: 'recovery', recoverer, config, safe })}
          />
        )),
      )}
    </>
  )
}

const AppliedPolicies = () => {
  const { allSafes, isLoading: spacesLoading } = useSpaceSafes()
  const flatSafes = useMemo(() => flattenSafes(allSafes), [allSafes])

  const [policyCounts, setPolicyCounts] = useState<Map<string, number>>(new Map())
  const [openDetail, setOpenDetail] = useState<PolicyDetail | null>(null)

  // Bumping this remounts every <SafePolicies> child — cheapest way to force
  // a re-fetch through the useAsync hooks without threading refetch APIs.
  const [refreshNonce, setRefreshNonce] = useState(0)

  const handlePoliciesChange = useCallback((key: string, count: number) => {
    setPolicyCounts((prev) => {
      if (prev.get(key) === count) return prev
      const next = new Map(prev)
      next.set(key, count)
      return next
    })
  }, [])

  const handleRefresh = useCallback(() => {
    setPolicyCounts(new Map())
    setRefreshNonce((n) => n + 1)
  }, [])

  const expectedScans = flatSafes.length
  const completedScans = policyCounts.size
  const stillScanning = spacesLoading || completedScans < expectedScans
  const totalActive = Array.from(policyCounts.values()).reduce((a, b) => a + b, 0)

  if (flatSafes.length === 0 && !spacesLoading) return null

  return (
    <Stack gap={1.5} sx={{ maxWidth: 1040 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
          Active policies
        </Typography>
        {stillScanning ? (
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'text.secondary',
                animation: 'scanPulse 1.2s ease-in-out infinite',
                '@keyframes scanPulse': {
                  '0%, 100%': { opacity: 0.3 },
                  '50%': { opacity: 1 },
                },
              }}
            />
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Scanning {flatSafes.length} {flatSafes.length === 1 ? 'safe' : 'safes'}…
            </Typography>
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
            {totalActive}
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        {flatSafes.length > 0 && (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: 'text.secondary',
                letterSpacing: '0.2px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {flatSafes.length} {flatSafes.length === 1 ? 'safe' : 'safes'} scanned
            </Typography>
            <Tooltip title="Re-scan safes" placement="top">
              <span>
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={stillScanning}
                  aria-label="Re-scan safes for policies"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                    transition: 'color 150ms ease',
                  }}
                >
                  <RefreshCw
                    size={13}
                    className={stillScanning ? 'animate-spin' : undefined}
                    style={{ display: 'block' }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      <Stack gap={1}>
        {flatSafes.map((s) => (
          <Fragment key={`${safeKey(s)}:${refreshNonce}`}>
            <SafePolicies safe={s} onPoliciesChange={handlePoliciesChange} onOpenDetail={setOpenDetail} />
          </Fragment>
        ))}
      </Stack>

      <PolicyDetailDrawer policy={openDetail} onClose={() => setOpenDetail(null)} />

      {!stillScanning && totalActive === 0 && (
        <Paper
          elevation={0}
          sx={{
            padding: '14px 18px',
            borderRadius: '14px',
            backgroundColor: 'background.paper',
            border: '1px dashed rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            No policies applied to the {flatSafes.length} {flatSafes.length === 1 ? 'safe' : 'safes'} in this space yet.
          </Typography>
        </Paper>
      )}
    </Stack>
  )
}

export default AppliedPolicies
