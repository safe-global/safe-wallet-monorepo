import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Chip, InputBase, Paper, Stack, Typography } from '@mui/material'
import { isAddress } from 'ethers'
import { Plus, ScrollText, Search, ShieldCheck, X } from 'lucide-react'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import EthHashInfo from '@/components/common/EthHashInfo'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { FormHeader, PolicySummaryRow, SelectionCheck, VerticalWizard, selectedRowStyles } from '../wizardCommon'
import { tokensForChain } from './tokenList'
import { useSubmitPolicy } from './useSubmitPolicy'
import type { Period } from './buildBatch'

const STEPS = [
  { key: 'wallet', label: 'Spender' },
  { key: 'tokens', label: 'Tokens' },
  { key: 'amount', label: 'Amount' },
  { key: 'review', label: 'Review' },
] as const

type StepKey = (typeof STEPS)[number]['key']

const STABLECOIN_SYMBOLS = new Set(['USDC', 'USDT', 'DAI', 'FRAX', 'PYUSD', 'USDE', 'BUSD', 'GUSD', 'TUSD', 'LUSD'])

type PolicySummaryProps = {
  chainId: string
  safeAddress: string
  delegate: string
  pickedTokens: TokenItem[]
  amount: number
  period: Period
  tokenAmounts: Record<string, number>
}

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
}

const formatSummaryTokenAmount = (value: number, decimals: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '—'
  const max = value >= 1 ? Math.min(decimals, 4) : 6
  return value.toLocaleString('en-US', { maximumFractionDigits: max })
}

const PolicySummary = ({
  chainId,
  safeAddress,
  delegate,
  pickedTokens,
  amount,
  period,
  tokenAmounts,
}: PolicySummaryProps) => {
  const hasDelegate = isAddress(delegate.trim())
  const hasTokens = pickedTokens.length > 0

  const tokenLines = pickedTokens.map((t) => {
    const rate = t.fiatConversion ? Number(t.fiatConversion) : NaN
    const priced = Number.isFinite(rate) && rate > 0
    const value = priced ? amount / rate : (tokenAmounts[t.address.toLowerCase()] ?? 0)
    return { token: t, value, hasValue: value > 0 }
  })
  const hasAnyAmount = tokenLines.some((l) => l.hasValue)

  return (
    <Paper elevation={0} sx={{ borderRadius: '18px', padding: 1.5, position: 'sticky', top: 24 }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ px: 0.5, pb: 1.25 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '7px',
            backgroundColor: 'background.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ScrollText size={13} />
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Policy summary</Typography>
      </Stack>

      <PolicySummaryRow
        isFirst
        label="From"
        value={
          safeAddress && chainId ? (
            <EthHashInfo address={safeAddress} chainId={chainId} shortAddress avatarSize={20} showCopyButton={false} />
          ) : (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>—</Typography>
          )
        }
      />

      <PolicySummaryRow
        label="Spender"
        pending={!hasDelegate}
        value={
          hasDelegate ? (
            <EthHashInfo
              address={delegate.trim()}
              chainId={chainId}
              shortAddress
              avatarSize={20}
              showCopyButton={false}
            />
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>Not set</Typography>
          )
        }
      />

      <PolicySummaryRow
        label={`Per ${period}`}
        pending={!hasTokens}
        value={
          !hasTokens ? (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>Not set</Typography>
          ) : (
            <Stack gap={0.75}>
              {tokenLines.map(({ token, value, hasValue }) => (
                <Stack key={token.address} direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
                    <TokenLogo token={token} size={16} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{token.symbol}</Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: hasValue ? 'text.primary' : 'text.secondary',
                    }}
                  >
                    {formatSummaryTokenAmount(value, token.decimals)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )
        }
      />

      <PolicySummaryRow
        label="Resets"
        pending={!hasAnyAmount}
        value={
          hasAnyAmount ? (
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{PERIOD_LABELS[period]}</Typography>
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>—</Typography>
          )
        }
      />

      <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', mt: 0.75, pt: 1.25, px: 0.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={0.75}
          sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}
        >
          <ShieldCheck size={12} color="#1C5538" />
          Enforced by Safe Allowance Module
        </Stack>
      </Box>
    </Paper>
  )
}

type TokenItem = {
  address: string
  symbol: string
  name: string
  decimals: number
  logoUri: string
  isNative: boolean
  balance?: string
  fiatBalance?: string
  fiatConversion?: string
  isCustom?: boolean
}

const formatTokenAmount = (raw: string | undefined, decimals: number): string => {
  if (!raw) return '—'
  try {
    const big = BigInt(raw)
    const negative = big < 0n
    const abs = negative ? -big : big
    const integer = abs / 10n ** BigInt(decimals)
    const fraction = abs % 10n ** BigInt(decimals)
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '')
    const intStr = Number(integer).toLocaleString('en-US')
    const sign = negative ? '-' : ''
    return fractionStr ? `${sign}${intStr}.${fractionStr}` : `${sign}${intStr}`
  } catch {
    return raw
  }
}

const formatFiat = (raw: string | undefined): string => {
  if (!raw) return ''
  const num = Number(raw)
  if (Number.isNaN(num)) return ''
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

const TokenLogo = ({ token, size = 32 }: { token: TokenItem; size?: number }) => {
  if (token.logoUri) {
    return (
      <Box
        component="img"
        src={token.logoUri}
        alt=""
        sx={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, backgroundColor: 'background.main' }}
      />
    )
  }
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor: 'background.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size <= 22 ? 10 : 11,
        fontWeight: 700,
        color: 'text.secondary',
      }}
    >
      {token.symbol.slice(0, 2).toUpperCase()}
    </Box>
  )
}

type TokenRowProps = {
  token: TokenItem
  selected: boolean
  onToggle: () => void
}

const TokenRow = ({ token, selected, onToggle }: TokenRowProps) => {
  return (
    <Paper
      elevation={0}
      onClick={onToggle}
      sx={{
        cursor: 'pointer',
        padding: '14px 18px',
        borderRadius: '14px',
        border: '1.5px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        ...(selected && selectedRowStyles),
        '&:hover': selected ? {} : { backgroundColor: 'background.main' },
      }}
    >
      <TokenLogo token={token} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{token.symbol}</Typography>
          {token.isNative && (
            <Chip
              label="Native"
              size="small"
              sx={{ fontSize: 10, fontWeight: 600, height: 18, backgroundColor: 'secondary.background' }}
            />
          )}
          {token.isCustom && (
            <Chip
              label="Custom"
              size="small"
              sx={{ fontSize: 10, fontWeight: 600, height: 18, backgroundColor: 'background.main' }}
            />
          )}
        </Stack>
        <Typography
          sx={{ fontSize: 12, color: 'text.secondary', mt: '1px', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {token.name}
        </Typography>
      </Box>

      {token.balance && (
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatTokenAmount(token.balance, token.decimals)}
          </Typography>
          {token.fiatBalance && (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '1px', fontVariantNumeric: 'tabular-nums' }}>
              {formatFiat(token.fiatBalance)}
            </Typography>
          )}
        </Box>
      )}

      <SelectionCheck selected={selected} />
    </Paper>
  )
}

const balancesToTokens = (items: Balance[] | undefined): TokenItem[] => {
  if (!items) return []
  return items
    .filter((b) => b.tokenInfo.type !== 'ERC721')
    .map((b) => ({
      address: b.tokenInfo.address.toLowerCase(),
      symbol: b.tokenInfo.symbol,
      name: b.tokenInfo.name,
      decimals: b.tokenInfo.decimals,
      logoUri: b.tokenInfo.logoUri,
      isNative: b.tokenInfo.type === 'NATIVE_TOKEN',
      balance: b.balance,
      fiatBalance: b.fiatBalance,
      fiatConversion: b.fiatConversion,
    }))
}

const FilterPill = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    sx={{
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      px: 1.5,
      height: 28,
      borderRadius: '9999px',
      border: '1px solid',
      borderColor: 'border.light',
      backgroundColor: 'background.paper',
      fontFamily: 'inherit',
      fontSize: 12,
      fontWeight: 500,
      color: 'text.secondary',
      userSelect: 'none',
      transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
      '&:hover': { backgroundColor: 'background.main', color: 'text.primary' },
      '&:active': { backgroundColor: 'border.light' },
      '&:focus-visible': { outline: '2px solid', outlineColor: 'text.primary', outlineOffset: 1 },
    }}
  >
    {label}
  </Box>
)

type TokensStepProps = {
  chainId: string
  address: string
  pickedTokens: TokenItem[]
  setPickedTokens: (next: TokenItem[]) => void
  customTokens: TokenItem[]
  setCustomTokens: (next: TokenItem[]) => void
}

const TokensStep = ({
  chainId,
  address,
  pickedTokens,
  setPickedTokens,
  customTokens,
  setCustomTokens,
}: TokensStepProps) => {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useBalancesGetBalancesV1Query(
    { chainId, safeAddress: address, fiatCode: 'USD', trusted: true, excludeSpam: true },
    { skip: !chainId || !address },
  )
  // Second pass: include untrusted/spam balances so we capture prices for any token
  // the Safe holds, even if filtered out of the main list. The CGW gateway has no
  // general "price-by-address" endpoint — this is the only price source available.
  const { data: allBalancesData } = useBalancesGetBalancesV1Query(
    { chainId, safeAddress: address, fiatCode: 'USD', trusted: false, excludeSpam: false },
    { skip: !chainId || !address },
  )

  const apiTokens = useMemo(() => balancesToTokens(data?.items), [data])

  // Combined address → fiatConversion map across both balance calls. Used to enrich
  // tokens from the static Uniswap list / custom paste with live prices when possible.
  const priceLookup = useMemo(() => {
    const lookup: Record<string, string> = {}
    for (const item of [...(data?.items ?? []), ...(allBalancesData?.items ?? [])]) {
      const addr = item.tokenInfo.address.toLowerCase()
      if (item.fiatConversion && !lookup[addr]) lookup[addr] = item.fiatConversion
    }
    return lookup
  }, [data, allBalancesData])

  const [extraTokens, setExtraTokens] = useState<TokenItem[]>([])
  useEffect(() => {
    if (!chainId) return
    let active = true
    tokensForChain(chainId)
      .then((entries) => {
        if (!active) return
        setExtraTokens(
          entries.map((t) => ({
            address: t.address.toLowerCase(),
            symbol: t.symbol,
            name: t.name,
            decimals: t.decimals,
            logoUri: t.logoURI ?? '',
            isNative: false,
          })),
        )
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [chainId])

  const TOKEN_CAP = 100
  const allTokens = useMemo(() => {
    const enrich = (t: TokenItem): TokenItem =>
      t.fiatConversion ? t : { ...t, fiatConversion: priceLookup[t.address] }
    const seen = new Set<string>()
    const head: TokenItem[] = []
    for (const t of [...apiTokens, ...extraTokens]) {
      if (seen.has(t.address)) continue
      seen.add(t.address)
      head.push(enrich(t))
      if (head.length >= TOKEN_CAP) break
    }
    for (const t of customTokens) {
      if (seen.has(t.address)) continue
      seen.add(t.address)
      head.push(enrich(t))
    }
    return head
  }, [apiTokens, extraTokens, customTokens, priceLookup])

  const trimmedSearch = search.trim()
  const lowerSearch = trimmedSearch.toLowerCase()
  const isAddressSearch = /^0x[a-fA-F0-9]{40}$/.test(trimmedSearch)

  const visibleTokens = useMemo(() => {
    if (!trimmedSearch) return allTokens
    return allTokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(lowerSearch) ||
        t.name.toLowerCase().includes(lowerSearch) ||
        t.address === lowerSearch,
    )
  }, [allTokens, trimmedSearch, lowerSearch])

  const showCustomCta = isAddressSearch && !allTokens.some((t) => t.address === lowerSearch)

  const isPicked = (addr: string) => pickedTokens.some((t) => t.address === addr)

  const toggleToken = (token: TokenItem) => {
    if (isPicked(token.address)) {
      setPickedTokens(pickedTokens.filter((t) => t.address !== token.address))
    } else {
      setPickedTokens([...pickedTokens, token])
    }
  }

  const addCustomToken = () => {
    if (!isAddressSearch) return
    const existing = allTokens.find((t) => t.address === lowerSearch)
    if (existing) {
      if (!isPicked(existing.address)) setPickedTokens([...pickedTokens, existing])
      setSearch('')
      return
    }
    const short = `${trimmedSearch.slice(0, 6)}…${trimmedSearch.slice(-4)}`
    const newToken: TokenItem = {
      address: lowerSearch,
      symbol: short,
      name: 'Custom token',
      decimals: 18,
      logoUri: '',
      isNative: false,
      isCustom: true,
    }
    setCustomTokens([...customTokens, newToken])
    setPickedTokens([...pickedTokens, newToken])
    setSearch('')
  }

  const pickStablecoins = () => {
    const next = [...pickedTokens]
    for (const t of allTokens) {
      if (STABLECOIN_SYMBOLS.has(t.symbol.toUpperCase()) && !next.some((p) => p.address === t.address)) {
        next.push(t)
      }
    }
    setPickedTokens(next)
  }

  const pickNative = () => {
    const next = [...pickedTokens]
    for (const t of allTokens) {
      if (t.isNative && !next.some((p) => p.address === t.address)) next.push(t)
    }
    setPickedTokens(next)
  }

  const clearAll = () => setPickedTokens([])

  return (
    <>
      <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
        Which tokens?
      </Typography>

      <Paper
        elevation={0}
        sx={{
          padding: '10px 14px',
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'border.light',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 1.5,
          transition: 'border-color 150ms ease, box-shadow 180ms ease',
          '&:focus-within': {
            borderColor: 'text.primary',
            boxShadow: '0 0 0 3px rgba(18, 255, 128, 0.15)',
          },
        }}
      >
        <Search size={16} color="#737373" />
        <InputBase
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tokens or paste a contract address"
          sx={{ fontSize: 14 }}
        />
        {search && (
          <Box
            onClick={() => setSearch('')}
            sx={{ display: 'flex', cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            <X size={14} />
          </Box>
        )}
      </Paper>

      <Stack direction="row" alignItems="center" gap={1} mb={2} flexWrap="wrap">
        <FilterPill label="Stablecoins" onClick={pickStablecoins} />
        <FilterPill label="Native" onClick={pickNative} />
        <FilterPill label="Clear" onClick={clearAll} />
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
          {pickedTokens.length === 0 ? 'None selected' : `${pickedTokens.length} selected`}
        </Typography>
      </Stack>

      {showCustomCta && (
        <Paper
          elevation={0}
          onClick={addCustomToken}
          sx={{
            cursor: 'pointer',
            padding: '14px 18px',
            borderRadius: '14px',
            border: '1.5px dashed',
            borderColor: 'secondary.main',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 1.5,
            backgroundColor: 'secondary.background',
            transition: 'box-shadow 180ms ease',
            '&:hover': { boxShadow: '0 8px 24px -16px rgba(18, 255, 128, 0.35)' },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Plus size={16} color="#1C5538" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Add custom token</Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: 'text.secondary',
                mt: '1px',
                fontVariantNumeric: 'tabular-nums',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {trimmedSearch}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'success.dark' }}>Use this address</Typography>
        </Paper>
      )}

      {isLoading && allTokens.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            textAlign: 'center',
            borderRadius: '14px',
          }}
        >
          <Typography sx={{ color: 'text.secondary' }}>Loading tokens…</Typography>
        </Paper>
      ) : visibleTokens.length === 0 && !showCustomCta ? (
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            textAlign: 'center',
            borderRadius: '14px',
          }}
        >
          <Typography sx={{ color: 'text.secondary' }}>No tokens match &quot;{trimmedSearch}&quot;.</Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            maxHeight: 560,
            overflowY: 'auto',
            pr: 0.5,
            mr: -0.5,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'border.light', borderRadius: 3 },
            '&::-webkit-scrollbar-thumb:hover': { backgroundColor: 'border.main' },
          }}
        >
          <Stack gap={1}>
            {visibleTokens.map((token) => (
              <TokenRow
                key={token.address}
                token={token}
                selected={isPicked(token.address)}
                onToggle={() => toggleToken(token)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </>
  )
}

type WalletStepProps = {
  chainId: string
  safeAddress: string
  delegate: string
  setDelegate: (next: string) => void
}

const WalletStep = ({ chainId, safeAddress, delegate, setDelegate }: WalletStepProps) => {
  const { data: safeInfo } = useSafesGetSafeV1Query({ chainId, safeAddress }, { skip: !chainId || !safeAddress })
  const owners = safeInfo?.owners ?? []
  const normalizedDelegate = delegate.toLowerCase()

  return (
    <>
      <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
        Who gets this limit?
      </Typography>

      {!safeInfo ? (
        <Paper elevation={0} sx={{ padding: 4, textAlign: 'center', borderRadius: '14px' }}>
          <Typography sx={{ color: 'text.secondary' }}>Loading signers…</Typography>
        </Paper>
      ) : owners.length === 0 ? (
        <Paper elevation={0} sx={{ padding: 4, textAlign: 'center', borderRadius: '14px' }}>
          <Typography sx={{ color: 'text.secondary' }}>This Safe has no signers.</Typography>
        </Paper>
      ) : (
        <Stack gap={1}>
          {owners.map((owner) => {
            const selected = owner.value.toLowerCase() === normalizedDelegate
            return (
              <Paper
                key={owner.value}
                elevation={0}
                onClick={() => setDelegate(owner.value)}
                sx={{
                  cursor: 'pointer',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: '1.5px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'background-color 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
                  ...(selected && selectedRowStyles),
                  '&:hover': selected ? {} : { backgroundColor: 'background.main' },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <EthHashInfo
                    address={owner.value}
                    chainId={chainId}
                    shortAddress
                    avatarSize={32}
                    showCopyButton={false}
                    name={owner.name || undefined}
                  />
                </Box>
                <SelectionCheck selected={selected} />
              </Paper>
            )
          })}
        </Stack>
      )}
    </>
  )
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

type AmountStepProps = {
  amount: number
  setAmount: (n: number) => void
  period: Period
  setPeriod: (p: Period) => void
  pickedTokens: TokenItem[]
  tokenAmounts: Record<string, number>
  setTokenAmount: (address: string, value: number) => void
}

const AmountStep = ({
  amount,
  setAmount,
  period,
  setPeriod,
  pickedTokens,
  tokenAmounts,
  setTokenAmount,
}: AmountStepProps) => {
  const hasPricedTokens = pickedTokens.some((t) => {
    const rate = t.fiatConversion ? Number(t.fiatConversion) : NaN
    return Number.isFinite(rate) && rate > 0
  })
  const usdDisabled = !hasPricedTokens

  const formatted = !usdDisabled && amount > 0 ? amount.toLocaleString('en-US', { maximumFractionDigits: 2 }) : ''

  const handleAmountChange = (raw: string) => {
    const clean = raw.replace(/[^\d.]/g, '')
    const num = parseFloat(clean)
    setAmount(Number.isFinite(num) ? num : 0)
  }

  return (
    <>
      <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
        How much, how often?
      </Typography>

      <Stack gap={3}>
        <Paper elevation={0} sx={{ borderRadius: '18px', padding: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Limit
            </Typography>
            <Stack
              direction="row"
              sx={{
                backgroundColor: 'background.main',
                borderRadius: '10px',
                padding: '3px',
                gap: '2px',
              }}
            >
              {PERIODS.map((p) => {
                const active = period === p.key
                return (
                  <Box
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    sx={{
                      minWidth: 60,
                      textAlign: 'center',
                      py: 0.5,
                      px: 1.5,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: '7px',
                      backgroundColor: active ? 'background.paper' : 'transparent',
                      color: active ? 'text.primary' : 'text.secondary',
                      boxShadow: active ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                      transition: 'all 150ms',
                    }}
                  >
                    {p.label}
                  </Box>
                )
              })}
            </Stack>
          </Stack>

          <Box sx={{ position: 'relative', mt: 2, opacity: usdDisabled ? 0.35 : 1 }}>
            <Typography
              sx={{
                position: 'absolute',
                left: 0,
                top: 4,
                fontSize: 44,
                fontWeight: 300,
                color: 'text.secondary',
                lineHeight: 1,
                pointerEvents: 'none',
              }}
            >
              $
            </Typography>
            <InputBase
              value={formatted}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={usdDisabled ? '—' : '0'}
              disabled={usdDisabled}
              sx={{
                width: '100%',
                pl: 3.5,
                '& input': {
                  fontSize: 44,
                  fontWeight: 700,
                  letterSpacing: '-1.4px',
                  padding: 0,
                  WebkitTextFillColor: 'unset',
                },
              }}
            />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: '18px', padding: 2.5 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              mb: 1.5,
            }}
          >
            Equivalent
          </Typography>

          {pickedTokens.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary', py: 1 }}>
              Select tokens to see conversion.
            </Typography>
          ) : (
            <Stack>
              {pickedTokens.map((token, idx) => {
                const rate = token.fiatConversion ? Number(token.fiatConversion) : NaN
                const valid = Number.isFinite(rate) && rate > 0
                const manualValue = tokenAmounts[token.address.toLowerCase()] ?? 0
                const equiv = valid ? amount / rate : null
                const display =
                  equiv !== null
                    ? equiv >= 1
                      ? equiv.toLocaleString('en-US', { maximumFractionDigits: Math.min(token.decimals, 4) })
                      : equiv.toLocaleString('en-US', { maximumFractionDigits: 6 })
                    : null

                const handleManual = (raw: string) => {
                  const clean = raw.replace(/[^\d.]/g, '')
                  const num = parseFloat(clean)
                  setTokenAmount(token.address, Number.isFinite(num) ? num : 0)
                }

                return (
                  <Stack
                    key={token.address}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      py: 1.25,
                      borderBottom: idx === pickedTokens.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <TokenLogo token={token} size={22} />
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{token.symbol}</Typography>
                    </Stack>
                    {valid ? (
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'text.primary',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {display}
                      </Typography>
                    ) : (
                      <InputBase
                        value={manualValue > 0 ? manualValue : ''}
                        onChange={(e) => handleManual(e.target.value)}
                        placeholder="Enter amount"
                        inputProps={{ inputMode: 'decimal', 'aria-label': `${token.symbol} amount` }}
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          width: 110,
                          paddingX: 1,
                          paddingY: 0.25,
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: 'border.light',
                          transition: 'border-color 150ms ease, box-shadow 150ms ease',
                          '&:focus-within': {
                            borderColor: 'text.primary',
                            boxShadow: '0 0 0 3px rgba(18, 255, 128, 0.15)',
                          },
                          '& input': { textAlign: 'right', padding: 0 },
                        }}
                      />
                    )}
                  </Stack>
                )
              })}
            </Stack>
          )}
        </Paper>
      </Stack>
    </>
  )
}

type ReviewStepProps = {
  chainId: string
  address: string
  delegate: string
  tokens: TokenItem[]
  amount: number
  period: Period
  tokenAmounts: Record<string, number>
  submitError: string | null
}

const formatTokenAmountDisplay = (value: number, decimals: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '—'
  const maxDigits = value >= 1 ? Math.min(decimals, 4) : 6
  return value.toLocaleString('en-US', { maximumFractionDigits: maxDigits })
}

const REVIEW_DIVIDER = '1px solid rgba(0, 0, 0, 0.05)'

const DetailRow = ({
  label,
  children,
  noBorderBottom = false,
}: {
  label: string
  children: React.ReactNode
  noBorderBottom?: boolean
}) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    gap={2}
    sx={{
      padding: '12px 18px',
      borderBottom: noBorderBottom ? 'none' : REVIEW_DIVIDER,
    }}
  >
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
      }}
    >
      {label}
    </Typography>
    <Box sx={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      {children}
    </Box>
  </Stack>
)

const ReviewStep = ({
  chainId,
  address,
  delegate,
  tokens,
  amount,
  period,
  tokenAmounts,
  submitError,
}: ReviewStepProps) => {
  const tokenLines = tokens.map((t) => {
    const rate = t.fiatConversion ? Number(t.fiatConversion) : NaN
    const valid = Number.isFinite(rate) && rate > 0
    const value = valid ? amount / rate : (tokenAmounts[t.address.toLowerCase()] ?? 0)
    return { token: t, display: formatTokenAmountDisplay(value, t.decimals) }
  })

  const { data: safeInfo, isLoading: safeLoading } = useSafesGetSafeV1Query(
    { chainId, safeAddress: address },
    { skip: !chainId || !address },
  )
  const threshold = safeInfo?.threshold ?? 0
  const owners = safeInfo?.owners ?? []

  return (
    <>
      <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
        Ready to sign?
      </Typography>

      <Paper
        elevation={0}
        sx={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid', borderColor: 'border.light' }}
      >
        <DetailRow label="Safe">
          {address && chainId ? (
            <EthHashInfo address={address} chainId={chainId} shortAddress avatarSize={22} showCopyButton={false} />
          ) : (
            '—'
          )}
        </DetailRow>
        <DetailRow label="Spender">
          {delegate ? (
            <EthHashInfo address={delegate} chainId={chainId} shortAddress avatarSize={22} showCopyButton={false} />
          ) : (
            '—'
          )}
        </DetailRow>
        <Box sx={{ padding: '14px 18px', borderBottom: REVIEW_DIVIDER }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              mb: 1.25,
            }}
          >
            Limits per {period}
          </Typography>
          {tokenLines.length === 0 ? (
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>—</Typography>
          ) : (
            <Stack gap={0}>
              {tokenLines.map(({ token, display }, idx) => (
                <Stack
                  key={token.address}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    py: 1,
                    borderTop: idx === 0 ? 'none' : REVIEW_DIVIDER,
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1}>
                    <TokenLogo token={token} size={22} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{token.symbol}</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {display}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
        <DetailRow label="Enforced by">
          <ShieldCheck size={14} color="#1C5538" />
          Safe Allowance Module
        </DetailRow>

        <Box sx={{ padding: '14px 18px' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 0.75 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Signatures required</Typography>
            {owners.length > 0 && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 0.5,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'secondary.background',
                  color: 'success.dark',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>{threshold}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'success.dark', opacity: 0.7 }}>of</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>{owners.length}</Typography>
              </Box>
            )}
          </Stack>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: owners.length ? 1.5 : 0 }}>
            {safeLoading
              ? 'Loading signer threshold…'
              : owners.length === 0
                ? "The Safe's signer threshold must approve this policy on-chain."
                : threshold === owners.length
                  ? 'All signers must approve this policy on-chain.'
                  : `${threshold} of ${owners.length} signers must approve this policy on-chain.`}
          </Typography>

          {owners.length > 0 && (
            <Stack>
              {owners.map((owner, idx) => (
                <Box
                  key={owner.value}
                  sx={{
                    py: 1.25,
                    borderTop: idx === 0 ? 'none' : REVIEW_DIVIDER,
                  }}
                >
                  <EthHashInfo
                    address={owner.value}
                    chainId={chainId}
                    shortAddress
                    avatarSize={28}
                    showCopyButton={false}
                    name={owner.name || undefined}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>
      {submitError && (
        <Typography sx={{ fontSize: 12, color: 'error.main', mt: 2, lineHeight: 1.5 }}>{submitError}</Typography>
      )}
    </>
  )
}

const SpendingLimitFlow = () => {
  const router = useRouter()
  const { configs: chains } = useChains()

  const safeParam = (router.query.safe as string) || ''
  const { prefix: shortName, address } = useMemo(() => parsePrefixedAddress(safeParam), [safeParam])
  const chainId = useMemo(() => chains.find((c) => c.shortName === shortName)?.chainId ?? '', [chains, shortName])

  const rawStep = router.query.step as string | undefined
  const stepKey: StepKey = STEPS.some((s) => s.key === rawStep) ? (rawStep as StepKey) : 'wallet'
  const currentIndex = STEPS.findIndex((s) => s.key === stepKey)

  const [delegate, setDelegate] = useState('')
  const [pickedTokens, setPickedTokens] = useState<TokenItem[]>([])
  const [customTokens, setCustomTokens] = useState<TokenItem[]>([])
  const [amount, setAmount] = useState(0)
  const [period, setPeriod] = useState<Period>('day')
  const [tokenAmounts, setTokenAmounts] = useState<Record<string, number>>({})

  const setTokenAmount = (address: string, value: number) => {
    setTokenAmounts((prev) => ({ ...prev, [address.toLowerCase()]: value }))
  }

  // Reset wizard state and snap back to step 1 when the user switches Safes mid-flow.
  const prevSafeParamRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevSafeParamRef.current
    prevSafeParamRef.current = safeParam
    if (!prev || prev === safeParam) return

    setDelegate('')
    setPickedTokens([])
    setCustomTokens([])
    setAmount(0)
    setPeriod('day')
    setTokenAmounts({})

    if (router.query.step && router.query.step !== 'wallet') {
      void router.replace({
        pathname: AppRoutes.spaces.policies,
        query: { ...router.query, step: 'wallet' },
      })
    }
  }, [safeParam, router])

  const hasLiveRate = (t: TokenItem) => {
    const rate = t.fiatConversion ? Number(t.fiatConversion) : NaN
    return Number.isFinite(rate) && rate > 0
  }

  const tokenAmountFor = (t: TokenItem) => tokenAmounts[t.address.toLowerCase()] ?? 0
  const isTokenPriceable = (t: TokenItem) => (hasLiveRate(t) ? amount > 0 : tokenAmountFor(t) > 0)

  const trimmedDelegate = delegate.trim()
  const isDelegateValid = isAddress(trimmedDelegate)

  const { submit, isSubmitting, error: submitError } = useSubmitPolicy({ chainId, safeAddress: address })

  const goToStep = (key: StepKey) => {
    void router.replace({
      pathname: AppRoutes.spaces.policies,
      query: { ...router.query, step: key },
    })
  }

  const goBack = () => {
    if (currentIndex <= 0) {
      const { policy: _p, step: _s, ...rest } = router.query
      void router.replace({ pathname: AppRoutes.spaces.policies, query: rest })
      return
    }
    goToStep(STEPS[currentIndex - 1].key)
  }

  const submitPolicy = async () => {
    const txId = await submit({
      delegate: trimmedDelegate,
      amountUsd: amount,
      period,
      tokens: pickedTokens.map((t) => ({
        address: t.address,
        decimals: t.decimals,
        fiatConversion: t.fiatConversion,
        manualAmount: hasLiveRate(t) ? undefined : tokenAmountFor(t),
      })),
    })
    if (txId) {
      const { policy: _p, step: _s, safe: _sf, ...rest } = router.query
      void router.replace({ pathname: AppRoutes.spaces.policies, query: rest })
    }
  }

  const goNext = () => {
    if (stepKey === 'review') {
      void submitPolicy()
      return
    }
    if (currentIndex >= STEPS.length - 1) return
    goToStep(STEPS[currentIndex + 1].key)
  }

  const continueDisabled = (() => {
    if (stepKey === 'wallet') return !isDelegateValid
    if (stepKey === 'tokens') return pickedTokens.length === 0
    if (stepKey === 'amount') return !pickedTokens.every(isTokenPriceable)
    return false
  })()

  const isReview = stepKey === 'review'

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '200px minmax(0, 1fr) 340px' },
          gap: { xs: 3, md: 4 },
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <VerticalWizard steps={STEPS} currentIndex={currentIndex} />
        </Box>

        <Paper elevation={0} sx={{ borderRadius: '24px', padding: { xs: 3, md: 4 } }}>
          <FormHeader
            currentIndex={currentIndex}
            onBack={goBack}
            onNext={goNext}
            continueDisabled={continueDisabled}
            isReview={isReview}
            isSubmitting={isSubmitting}
          />

          {stepKey === 'wallet' && (
            <WalletStep chainId={chainId} safeAddress={address} delegate={delegate} setDelegate={setDelegate} />
          )}

          {stepKey === 'tokens' && (
            <TokensStep
              chainId={chainId}
              address={address}
              pickedTokens={pickedTokens}
              setPickedTokens={setPickedTokens}
              customTokens={customTokens}
              setCustomTokens={setCustomTokens}
            />
          )}

          {stepKey === 'amount' && (
            <AmountStep
              amount={amount}
              setAmount={setAmount}
              period={period}
              setPeriod={setPeriod}
              pickedTokens={pickedTokens}
              tokenAmounts={tokenAmounts}
              setTokenAmount={setTokenAmount}
            />
          )}

          {stepKey === 'review' && (
            <ReviewStep
              chainId={chainId}
              address={address}
              delegate={trimmedDelegate}
              tokens={pickedTokens}
              amount={amount}
              period={period}
              tokenAmounts={tokenAmounts}
              submitError={submitError}
            />
          )}
        </Paper>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <PolicySummary
            chainId={chainId}
            safeAddress={address}
            delegate={trimmedDelegate}
            pickedTokens={pickedTokens}
            amount={amount}
            period={period}
            tokenAmounts={tokenAmounts}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default SpendingLimitFlow
