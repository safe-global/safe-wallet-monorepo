import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Collapse, IconButton, Paper, Stack, Typography } from '@mui/material'
import {
  CalendarClock,
  ChevronDown,
  Clock,
  EllipsisVertical,
  LifeBuoy,
  Repeat,
  Trash2,
  WalletMinimal,
} from 'lucide-react'
import { shortenAddress, safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { relativeTime } from '@safe-global/utils/utils/date'
import { SafeIdenticon, ShortAddressWithTooltip } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveSpendingLimitFlow } from '@/components/tx-flow/flows'
import { useSpaceSafes } from '@/features/spaces'
import { findInstalledAllowanceAddress } from './useSafeSpendingLimits'
import useChains from '@/hooks/useChains'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { isMultiChainSafeItem } from '@/hooks/safes/useAllSafesGrouped'
import type { SpendingLimitState } from '@/features/spending-limits/types'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useSafeSpendingLimits } from './useSafeSpendingLimits'
import { useSafeRecovery, type SafeRecoveryConfig } from './useSafeRecovery'

type SafeRef = { chainId: string; address: string; name: string }

type BeneficiaryGroupData = {
  address: string
  limits: SpendingLimitState[]
}

const groupByBeneficiary = (limits: SpendingLimitState[]): BeneficiaryGroupData[] => {
  const map = new Map<string, BeneficiaryGroupData>()
  for (const l of limits) {
    const key = l.beneficiary.toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.limits.push(l)
    } else {
      map.set(key, { address: l.beneficiary, limits: [l] })
    }
  }
  return Array.from(map.values())
}

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

const StatusPill = () => (
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

const TokenSymbolBadge = ({ symbol, logoUri }: { symbol: string; logoUri?: string }) => {
  if (logoUri) {
    return (
      <Box
        component="img"
        src={logoUri}
        alt={symbol}
        sx={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          backgroundColor: 'background.main',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        backgroundColor: 'background.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontWeight: 700,
        color: 'text.secondary',
        flexShrink: 0,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {symbol.slice(0, 4).toUpperCase() || '?'}
    </Box>
  )
}

const LimitRow = ({ limit, safe }: { limit: SpendingLimitState; safe: SafeRef }) => {
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)
  const { configs: chains } = useChains()
  const shortName = useMemo(
    () => chains.find((c) => c.chainId === safe.chainId)?.shortName ?? '',
    [chains, safe.chainId],
  )

  const decimals = limit.token.decimals
  const symbol = limit.token.symbol || '?'
  const amount = safeFormatUnits(BigInt(limit.amount), decimals)
  const spent = safeFormatUnits(BigInt(limit.spent), decimals)
  const reset = relativeTime(limit.lastResetMin, limit.resetTimeMin)
  const isOneTime = limit.resetTimeMin === '0'

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!shortName) return
    // Inject the target Safe into the URL so useLoadSafeInfo populates the safeInfoSlice
    // — RemoveSpendingLimitFlow's review step reads `useSafeInfo()` internally.
    await router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, safe: `${shortName}:${safe.address}` },
      },
      undefined,
      { shallow: true },
    )
    setTxFlow(<RemoveSpendingLimitFlow spendingLimit={limit} />)
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      sx={{
        padding: '8px 0',
        borderTop: '1px solid rgba(0, 0, 0, 0.04)',
        '&:first-of-type': { borderTop: 'none' },
      }}
    >
      <TokenSymbolBadge symbol={symbol} logoUri={limit.token.logoUri || undefined} />
      <Stack sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{symbol}</Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {spent} of {amount}
        </Typography>
      </Stack>
      <Box sx={{ flex: 1 }} />
      <Stack direction="row" alignItems="center" gap={0.75}>
        {isOneTime ? <CalendarClock size={11} color="#737373" /> : <Repeat size={11} color="#737373" />}
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{reset}</Typography>
      </Stack>
      <IconButton
        size="small"
        onClick={handleDelete}
        aria-label="Remove spending limit"
        sx={{
          color: 'text.secondary',
          opacity: 0.5,
          transition: 'opacity 150ms ease, color 150ms ease',
          '&:hover': { opacity: 1, color: 'error.main' },
        }}
      >
        <Trash2 size={14} />
      </IconButton>
    </Stack>
  )
}

const BeneficiaryBlock = ({ group, safe }: { group: BeneficiaryGroupData; safe: SafeRef }) => {
  const contact = useAddressBookItem(group.address, safe.chainId)
  const name = contact?.name

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          color: 'text.secondary',
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          mb: 0.75,
        }}
      >
        Spender
      </Typography>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <SafeIdenticon address={group.address} size={24} />
        <Stack sx={{ minWidth: 0 }}>
          {name && <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{name}</Typography>}
          <ShortAddressWithTooltip address={group.address} />
        </Stack>
      </Stack>
      <Box>
        {group.limits.map((l) => (
          <LimitRow key={`${l.token.address}-${l.nonce}`} limit={l} safe={safe} />
        ))}
      </Box>
    </Box>
  )
}

type SafeSpendingLimitItemProps = {
  safe: SafeRef
  onAppliedChange: (key: string, isApplied: boolean) => void
}

const safeKey = (s: SafeRef) => `${s.chainId}:${s.address.toLowerCase()}`

const SafeSpendingLimitItem = ({ safe, onAppliedChange }: SafeSpendingLimitItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const { limits, loading, error, hasAllowanceModule } = useSafeSpendingLimits(safe.chainId, safe.address)
  const key = safeKey(safe)

  const groups = useMemo(() => groupByBeneficiary(limits), [limits])
  const totalTokens = limits.length
  const spenderCount = groups.length
  const hasAny = totalTokens > 0
  // Render whenever the AllowanceModule is detected — even if the multicall surfaced 0 delegates
  // or errored — so the user can see "the policy is deployed; here's why we can't read it".
  const shouldRender = hasAllowanceModule

  useEffect(() => {
    if (loading) return
    onAppliedChange(key, shouldRender)
  }, [key, shouldRender, loading, onAppliedChange])

  if (!shouldRender) return null

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.03)',
        transition: 'border-color 150ms ease',
        ...(expanded && { borderColor: 'rgba(0, 0, 0, 0.06)' }),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        onClick={() => setExpanded((x) => !x)}
        role="button"
        aria-expanded={expanded}
        sx={{
          padding: '12px 16px',
          cursor: 'pointer',
          transition: 'background-color 150ms ease',
          '&:hover': { backgroundColor: 'background.main' },
        }}
      >
        <SafeIdenticon address={safe.address} size={36} />

        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{safe.name || 'Safe'}</Typography>
            <Typography
              sx={{
                fontSize: 11.5,
                color: 'text.secondary',
                fontFamily: 'ui-monospace, monospace',
                display: { xs: 'none', sm: 'inline' },
              }}
            >
              {shortenAddress(safe.address)}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: '2px' }}>
            <WalletMinimal size={11} color="#1C5538" />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'success.dark' }}>Spending Limit</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
              {error
                ? 'failed to load'
                : hasAny
                  ? `${spenderCount} ${spenderCount === 1 ? 'spender' : 'spenders'}, ${totalTokens} ${
                      totalTokens === 1 ? 'token' : 'tokens'
                    }`
                  : 'module enabled · no spenders'}
            </Typography>
          </Stack>
        </Stack>

        <StatusPill />

        <ChevronDown
          size={16}
          color="#737373"
          style={{
            transition: 'transform 200ms ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            flexShrink: 0,
          }}
        />
      </Stack>

      <Collapse in={expanded} timeout={250} unmountOnExit>
        <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', padding: '18px 18px 14px' }}>
          {error ? (
            <Box
              sx={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'error.main', mb: 0.5 }}>
                Couldn&apos;t load spending limits
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{error.message}</Typography>
            </Box>
          ) : hasAny ? (
            <Stack gap={2.5}>
              {groups.map((g) => (
                <BeneficiaryBlock key={g.address} group={g} safe={safe} />
              ))}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              AllowanceModule is enabled on this Safe, but no spenders are configured yet.
            </Typography>
          )}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}
          >
            <IconButton size="small" sx={{ color: 'text.secondary' }} aria-label="Policy actions">
              <EllipsisVertical size={14} />
            </IconButton>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  )
}

type SafeRecoveryItemProps = {
  safe: SafeRef
  onAppliedChange: (key: string, isApplied: boolean) => void
}

const RecovererRow = ({ address, chainId }: { address: string; chainId: string }) => {
  const contact = useAddressBookItem(address, chainId)
  const name = contact?.name

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      sx={{
        padding: '8px 0',
        borderTop: '1px solid rgba(0, 0, 0, 0.04)',
        '&:first-of-type': { borderTop: 'none' },
      }}
    >
      <SafeIdenticon address={address} size={22} />
      <Stack sx={{ minWidth: 0 }}>
        {name && <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{name}</Typography>}
        <ShortAddressWithTooltip address={address} />
      </Stack>
    </Stack>
  )
}

const RecoveryConfigBlock = ({ config, chainId }: { config: SafeRecoveryConfig; chainId: string }) => {
  const cooldownLabel = formatDuration(config.cooldownSec)
  const expiryLabel = config.expirySec === 0n ? 'Never' : formatDuration(config.expirySec)

  return (
    <Stack gap={2}>
      <Stack
        direction="row"
        gap={3}
        sx={{
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: 'background.main',
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Clock size={12} color="#737373" />
          <Stack>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: 'text.secondary',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}
            >
              Review window
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{cooldownLabel}</Typography>
          </Stack>
        </Stack>
        <Stack direction="row" alignItems="center" gap={1}>
          <CalendarClock size={12} color="#737373" />
          <Stack>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: 'text.secondary',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}
            >
              Expires
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{expiryLabel}</Typography>
          </Stack>
        </Stack>
      </Stack>

      <Box>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: 'text.secondary',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          {config.recoverers.length === 1 ? 'Recoverer' : 'Recoverers'}
        </Typography>
        <Box>
          {config.recoverers.map((addr) => (
            <RecovererRow key={addr} address={addr} chainId={chainId} />
          ))}
        </Box>
      </Box>
    </Stack>
  )
}

const SafeRecoveryItem = ({ safe, onAppliedChange }: SafeRecoveryItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const { recovery, loading } = useSafeRecovery(safe.chainId, safe.address)
  const key = `${safeKey(safe)}:recovery`
  const hasAny = recovery.length > 0

  useEffect(() => {
    if (loading) return
    onAppliedChange(key, hasAny)
  }, [key, hasAny, loading, onAppliedChange])

  if (!hasAny) return null

  const totalRecoverers = recovery.reduce((acc, r) => acc + r.recoverers.length, 0)
  const firstCooldown = formatDuration(recovery[0].cooldownSec)

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.03)',
        transition: 'border-color 150ms ease',
        ...(expanded && { borderColor: 'rgba(0, 0, 0, 0.06)' }),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        onClick={() => setExpanded((x) => !x)}
        role="button"
        aria-expanded={expanded}
        sx={{
          padding: '12px 16px',
          cursor: 'pointer',
          transition: 'background-color 150ms ease',
          '&:hover': { backgroundColor: 'background.main' },
        }}
      >
        <SafeIdenticon address={safe.address} size={36} />

        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{safe.name || 'Safe'}</Typography>
            <Typography
              sx={{
                fontSize: 11.5,
                color: 'text.secondary',
                fontFamily: 'ui-monospace, monospace',
                display: { xs: 'none', sm: 'inline' },
              }}
            >
              {shortenAddress(safe.address)}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: '2px' }}>
            <LifeBuoy size={11} color="#1C5538" />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'success.dark' }}>Account Recovery</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
              {totalRecoverers} {totalRecoverers === 1 ? 'recoverer' : 'recoverers'}, {firstCooldown} review
            </Typography>
          </Stack>
        </Stack>

        <StatusPill />

        <ChevronDown
          size={16}
          color="#737373"
          style={{
            transition: 'transform 200ms ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            flexShrink: 0,
          }}
        />
      </Stack>

      <Collapse in={expanded} timeout={250} unmountOnExit>
        <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', padding: '18px 18px 14px' }}>
          <Stack gap={2.5}>
            {recovery.map((cfg) => (
              <RecoveryConfigBlock key={cfg.delayModifierAddress} config={cfg} chainId={safe.chainId} />
            ))}
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}
          >
            <IconButton size="small" sx={{ color: 'text.secondary' }} aria-label="Policy actions">
              <EllipsisVertical size={14} />
            </IconButton>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  )
}

const SafeScanRow = ({ safe }: { safe: SafeRef }) => {
  const { data: safeInfo, isLoading } = useSafesGetSafeV1Query(
    { chainId: safe.chainId, safeAddress: safe.address },
    { skip: !safe.chainId || !safe.address },
  )
  const contact = useAddressBookItem(safe.address, safe.chainId)
  const modules = safeInfo?.modules ?? []
  const moduleCount = modules.length
  const spendingLimitAddress = findInstalledAllowanceAddress(modules)
  const hasSpendingLimitModule = !!spendingLimitAddress
  const hasOtherModule = moduleCount > (hasSpendingLimitModule ? 1 : 0)
  const displayName = safe.name || contact?.name || ''

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      sx={{ padding: '6px 0', fontSize: 11.5, color: 'text.secondary', minWidth: 0 }}
    >
      <SafeIdenticon address={safe.address} size={16} />
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>
        {displayName || 'Safe'}
      </Typography>
      <ShortAddressWithTooltip address={safe.address} />
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>·</Typography>
      {isLoading ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Loading…</Typography>
      ) : (
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {moduleCount} {moduleCount === 1 ? 'module' : 'modules'}
        </Typography>
      )}
      {hasSpendingLimitModule && (
        <Box
          sx={{
            fontSize: 10,
            fontWeight: 700,
            color: 'success.dark',
            backgroundColor: 'secondary.background',
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}
        >
          Allowance
        </Box>
      )}
      {hasOtherModule && (
        <Box
          sx={{
            fontSize: 10,
            fontWeight: 700,
            color: 'text.secondary',
            backgroundColor: 'background.main',
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}
        >
          Other module
        </Box>
      )}
    </Stack>
  )
}

const ScanSummary = ({ safes, defaultOpen }: { safes: SafeRef[]; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <Box sx={{ mt: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        onClick={() => setOpen((x) => !x)}
        role="button"
        aria-expanded={open}
        sx={{
          cursor: 'pointer',
          fontSize: 11,
          color: 'text.secondary',
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        Scanned {safes.length} {safes.length === 1 ? 'safe' : 'safes'} in this space
        <ChevronDown
          size={12}
          style={{
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </Stack>
      <Collapse in={open} timeout={200}>
        <Stack sx={{ mt: 1, paddingLeft: 0.5 }}>
          {safes.map((s) => (
            <SafeScanRow key={`${s.chainId}:${s.address.toLowerCase()}`} safe={s} />
          ))}
        </Stack>
      </Collapse>
    </Box>
  )
}

const AppliedPolicies = () => {
  const { allSafes, isLoading: spacesLoading } = useSpaceSafes()
  const flatSafes = useMemo(() => flattenSafes(allSafes), [allSafes])

  // Each child reports once it has finished scanning. We track both whether it found a policy AND
  // whether the scan has completed, so the parent can show a "Scanning N safes…" indicator.
  const [scanStatuses, setScanStatuses] = useState<Map<string, boolean>>(new Map())

  const handleAppliedChange = useCallback((key: string, isApplied: boolean) => {
    setScanStatuses((prev) => {
      const existing = prev.get(key)
      if (existing === isApplied) return prev
      const next = new Map(prev)
      next.set(key, isApplied)
      return next
    })
  }, [])

  // Each Safe spawns 2 scans (spending limit + recovery). We're done when every scan reported back.
  const expectedScans = flatSafes.length * 2
  const completedScans = scanStatuses.size
  const stillScanning = spacesLoading || completedScans < expectedScans
  const appliedCount = Array.from(scanStatuses.values()).filter(Boolean).length

  if (flatSafes.length === 0 && !spacesLoading) return null

  return (
    <Stack gap={1.5} sx={{ maxWidth: 1040 }}>
      <Stack direction="row" alignItems="baseline" gap={1}>
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
            {appliedCount}
          </Typography>
        )}
      </Stack>

      <Stack gap={1}>
        {flatSafes.map((s) => (
          <Fragment key={safeKey(s)}>
            <SafeSpendingLimitItem safe={s} onAppliedChange={handleAppliedChange} />
            <SafeRecoveryItem safe={s} onAppliedChange={handleAppliedChange} />
          </Fragment>
        ))}
      </Stack>

      {!stillScanning && appliedCount === 0 && (
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

      {flatSafes.length > 0 && <ScanSummary safes={flatSafes} defaultOpen={!stillScanning && appliedCount === 0} />}
    </Stack>
  )
}

export default AppliedPolicies
