import { useContext, type ReactElement, type ReactNode } from 'react'
import { Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Clock, ExternalLink, LifeBuoy, ShieldCheck, Trash2, WalletMinimal, X } from 'lucide-react'
import { safeFormatUnits, shortenAddress } from '@safe-global/utils/utils/formatters'
import { relativeTime } from '@safe-global/utils/utils/date'
import EthHashInfo from '@/components/common/EthHashInfo'
import {
  ChainLogo,
  SafeIdenticon,
  ShortAddressWithTooltip,
} from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { Button } from '@/components/ui/button'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useChain } from '@/hooks/useChains'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveSpendingLimitFlow } from '@/components/tx-flow/flows'
import type { SpendingLimitState } from '@/features/spending-limits/types'
import type { SafeRecoveryConfig } from './useSafeRecovery'

const MotionBox = motion.create(Box)

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

export type PolicyDetail = SpendingLimitDetail | RecoveryDetail

type PolicyDetailDrawerProps = {
  policy: PolicyDetail | null
  onClose: () => void
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
  <Stack
    direction="row"
    alignItems="flex-start"
    gap={2}
    sx={{
      py: 1.5,
      px: 2,
      borderTop: divider ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
    }}
  >
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        width: 84,
        flexShrink: 0,
        pt: '3px',
      }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>{value}</Box>
  </Stack>
)

const SummaryCard = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      borderRadius: '16px',
      backgroundColor: 'background.paper',
      border: '1px solid rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
    }}
  >
    {children}
  </Box>
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
    <Stack direction="row" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
      {limit.token.logoUri ? (
        <Box
          component="img"
          src={limit.token.logoUri}
          alt={symbol}
          sx={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }}
        />
      ) : (
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'background.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            fontWeight: 700,
            color: 'text.secondary',
            flexShrink: 0,
          }}
        >
          {symbol.slice(0, 3).toUpperCase()}
        </Box>
      )}
      <Stack sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{symbol}</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{amount}</Typography>
        </Stack>
        {!isOneTime && (
          <>
            <Box
              sx={{
                mt: 0.5,
                height: 3,
                borderRadius: '999px',
                backgroundColor: 'background.main',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: progress >= 90 ? 'error.main' : progress >= 50 ? 'warning.main' : 'secondary.main',
                  transition: 'width 200ms ease, background-color 200ms ease',
                }}
              />
            </Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
              <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                {spent} spent
              </Typography>
              <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>resets {reset}</Typography>
            </Stack>
          </>
        )}
      </Stack>
      <Tooltip title="Remove this limit" placement="top">
        <IconButton
          size="small"
          onClick={handleRemove}
          aria-label={`Remove ${symbol} spending limit`}
          sx={{
            color: 'text.secondary',
            opacity: 0.55,
            transition: 'opacity 150ms ease, color 150ms ease',
            '&:hover': { opacity: 1, color: 'error.main' },
          }}
        >
          <Trash2 size={13} />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}

/* ------------------------------ The drawer ------------------------------- */

const PolicyDetailDrawer = ({ policy, onClose }: PolicyDetailDrawerProps): ReactElement => {
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
    <Drawer
      anchor="right"
      open={!!policy}
      onClose={onClose}
      variant="temporary"
      transitionDuration={250}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
      PaperProps={{
        sx: {
          width: 480,
          maxWidth: '100vw',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <AnimatePresence mode="wait">
        {policy && (
          <MotionBox
            key={`${policy.type}:${beneficiary}:${policy.safe.address}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
          >
            {/* Header */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 3,
                py: 2,
                borderBottom: 1,
                borderColor: 'border.light',
                backgroundColor: 'background.paper',
                flexShrink: 0,
              }}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '7px',
                    backgroundColor: 'background.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {policy.type === 'spending-limit' ? <WalletMinimal size={13} /> : <LifeBuoy size={13} />}
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                  {policy.type === 'spending-limit' ? 'Spending limit' : 'Account recovery'}
                </Typography>
              </Stack>
              <IconButton onClick={onClose} size="small" aria-label="Close policy details">
                <X size={16} />
              </IconButton>
            </Stack>

            {/* Body */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pt: 2.5, pb: 3 }}>
              <SummaryCard>
                <SummaryRow
                  divider={false}
                  label="From"
                  value={
                    <Stack direction="row" alignItems="center" gap={1}>
                      <SafeIdenticon address={policy.safe.address} size={22} />
                      <Stack sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
                          {policy.safe.name || 'Safe'}
                        </Typography>
                        <EthHashInfo
                          address={policy.safe.address}
                          chainId={policy.safe.chainId}
                          shortAddress
                          avatarSize={0}
                          showCopyButton={false}
                        />
                      </Stack>
                      <Box sx={{ flex: 1 }} />
                      <ChainLogo chainId={policy.safe.chainId} size={16} />
                    </Stack>
                  }
                />

                {policy.type === 'spending-limit' && (
                  <SummaryRow
                    label="Spender"
                    value={
                      isSpendingFallback ? (
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>
                          Details unavailable
                        </Typography>
                      ) : (
                        <Stack direction="row" alignItems="center" gap={1}>
                          <SafeIdenticon address={policy.beneficiary} size={22} />
                          <Stack sx={{ minWidth: 0 }}>
                            {contact?.name && (
                              <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }} noWrap>
                                {contact.name}
                              </Typography>
                            )}
                            <ShortAddressWithTooltip address={policy.beneficiary} />
                          </Stack>
                        </Stack>
                      )
                    }
                  />
                )}

                {policy.type === 'recovery' && (
                  <SummaryRow
                    label="Recoverer"
                    value={
                      <Stack direction="row" alignItems="center" gap={1}>
                        <SafeIdenticon address={policy.recoverer} size={22} />
                        <Stack sx={{ minWidth: 0 }}>
                          {contact?.name && (
                            <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }} noWrap>
                              {contact.name}
                            </Typography>
                          )}
                          <ShortAddressWithTooltip address={policy.recoverer} />
                        </Stack>
                      </Stack>
                    }
                  />
                )}

                {policy.type === 'spending-limit' && (
                  <SummaryRow
                    label={cadenceLabel === 'One-time' ? 'Limit' : `Per ${cadenceLabel?.toLowerCase() ?? 'period'}`}
                    value={
                      policy.limits.length === 0 ? (
                        <Typography
                          sx={{ fontSize: 12.5, fontWeight: 500, color: 'text.secondary', fontStyle: 'italic' }}
                        >
                          No active token limits — setup may be pending execution.
                        </Typography>
                      ) : (
                        <Stack gap={1.25}>
                          {policy.limits.map((limit) => (
                            <TokenRow
                              key={`${limit.token.address}-${limit.nonce}`}
                              limit={limit}
                              chainId={policy.safe.chainId}
                              safe={policy.safe}
                            />
                          ))}
                        </Stack>
                      )
                    }
                  />
                )}

                {policy.type === 'spending-limit' && policy.limits.length > 0 && (
                  <SummaryRow
                    label="Resets"
                    value={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>{cadenceLabel}</Typography>}
                  />
                )}

                {policy.type === 'recovery' && (
                  <>
                    <SummaryRow
                      label="Cooldown"
                      value={
                        <Stack direction="row" alignItems="center" gap={0.75}>
                          <Clock size={13} color="#737373" />
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {formatDuration(policy.config.cooldownSec)}
                          </Typography>
                        </Stack>
                      }
                    />
                    <SummaryRow
                      label="Expires"
                      value={
                        <Stack direction="row" alignItems="center" gap={0.75}>
                          <CalendarClock size={13} color="#737373" />
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {policy.config.expirySec === 0n ? 'Never' : formatDuration(policy.config.expirySec)}
                          </Typography>
                        </Stack>
                      }
                    />
                    <SummaryRow
                      label="Module"
                      value={
                        <Typography
                          sx={{ fontSize: 12.5, color: 'text.secondary', fontFamily: 'ui-monospace, monospace' }}
                        >
                          {shortenAddress(policy.config.delayModifierAddress)}
                        </Typography>
                      }
                    />
                  </>
                )}
              </SummaryCard>

              {/* Enforced-by footnote, matching the wizard summary */}
              <Stack
                direction="row"
                alignItems="center"
                gap={0.75}
                sx={{ mt: 1.5, px: 0.5, fontSize: 11.5, fontWeight: 600, color: 'text.secondary' }}
              >
                <ShieldCheck size={12} color="#1C5538" />
                Enforced by {policy.type === 'spending-limit' ? 'Safe Allowance Module' : 'Safe Delay Modifier'}
              </Stack>

              {/* CTAs */}
              {settingsHref && (
                <Stack direction="row" gap={1} sx={{ mt: 3 }}>
                  <Button
                    variant="outline"
                    onClick={() => window.open(settingsHref, '_blank', 'noreferrer')}
                    className="flex-1"
                  >
                    <ExternalLink className="size-4" />
                    Manage on Safe
                  </Button>
                </Stack>
              )}
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Drawer>
  )
}

export default PolicyDetailDrawer
