import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Checkbox, Chip, InputBase, Paper, Stack, Typography } from '@mui/material'
import { isAddress } from 'ethers'
import { Loader2, Plus, ScrollText, Search, ShieldCheck, Tag, Wallet, X } from 'lucide-react'
import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import EthHashInfo from '@/components/common/EthHashInfo'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem } from '@/hooks/safes/useAllSafesGrouped'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  ApplyToStep,
  FormHeader,
  PolicySummaryRow,
  SelectionCheck,
  VerticalWizard,
  WizardField,
  WizardLayout,
  safeKey,
  selectedRowStyles,
  type SafeRowItem,
} from '../wizardCommon'
import { tokensForChain } from './tokenList'
import { useSubmitPolicy } from './useSubmitPolicy'
import type { Period } from './buildBatch'

const STEPS = [
  { key: 'apply-to', label: 'Apply to' },
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
  delegateNickname: string
  pickedTokens: TokenItem[]
  amount: number
  period: Period
  tokenAmounts: Record<string, number>
}

const PERIOD_LABELS: Record<Period, string> = {
  once: 'One-time',
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
  delegateNickname,
  pickedTokens,
  amount,
  period,
  tokenAmounts,
}: PolicySummaryProps) => {
  const hasDelegate = isAddress(delegate.trim())
  const nick = delegateNickname.trim()
  const hasTokens = pickedTokens.length > 0

  const tokenLines = pickedTokens.map((t) => {
    const rate = t.fiatConversion ? Number(t.fiatConversion) : NaN
    const priced = Number.isFinite(rate) && rate > 0
    const value = priced ? amount / rate : (tokenAmounts[t.address.toLowerCase()] ?? 0)
    return { token: t, value, hasValue: value > 0 }
  })
  const hasAnyAmount = tokenLines.some((l) => l.hasValue)

  return (
    <Paper elevation={0} sx={{ borderRadius: '18px', padding: 3, position: 'sticky', top: 24 }}>
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
        pending={!(safeAddress && chainId)}
        value={
          safeAddress && chainId ? (
            <EthHashInfo address={safeAddress} chainId={chainId} shortAddress avatarSize={20} showCopyButton={false} />
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>Not set</Typography>
          )
        }
      />

      <PolicySummaryRow
        label="Spender"
        pending={!hasDelegate}
        value={
          hasDelegate ? (
            <Stack sx={{ minWidth: 0 }}>
              {nick && <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{nick}</Typography>}
              <EthHashInfo
                address={delegate.trim()}
                chainId={chainId}
                shortAddress
                avatarSize={nick ? 0 : 20}
                showCopyButton={false}
              />
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>Not set</Typography>
          )
        }
      />

      <PolicySummaryRow
        label={period === 'once' ? 'One-time limit' : `Per ${period}`}
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
        label={period === 'once' ? 'Mode' : 'Resets'}
        pending={!hasAnyAmount}
        value={
          hasAnyAmount ? (
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {period === 'once' ? 'Single use' : PERIOD_LABELS[period]}
            </Typography>
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
  address: string
  setAddress: (v: string) => void
  nickname: string
  setNickname: (v: string) => void
  resolvedAddress: string | undefined
  resolving: boolean
  isHexAddress: boolean
  addressBookName: string | undefined
  saveToAddressBook: boolean
  setSaveToAddressBook: (v: boolean) => void
}

const WalletStep = ({
  address,
  setAddress,
  nickname,
  setNickname,
  resolvedAddress,
  resolving,
  isHexAddress,
  addressBookName,
  saveToAddressBook,
  setSaveToAddressBook,
}: WalletStepProps) => {
  const trimmed = address.trim()
  const valid = !!resolvedAddress
  const isEmpty = trimmed.length === 0
  const showError = !isEmpty && !valid && !resolving
  const isKnownContact = valid && !!addressBookName

  return (
    <>
      <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
        Who gets this spending limit?
      </Typography>

      <Stack gap={2.5}>
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Spender address</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>ENS supported</Typography>
          </Stack>
          <WizardField
            icon={<Wallet size={16} color="#1C5538" />}
            iconBg="accent"
            value={address}
            onChange={setAddress}
            placeholder="0x… or name.eth"
            state={showError ? 'error' : valid ? 'valid' : 'default'}
            ariaLabel="Spender address"
            adornment={
              resolving ? (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: 'background.main',
                    color: 'text.secondary',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  Resolving…
                </Box>
              ) : valid ? (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: 'secondary.background',
                    color: 'success.dark',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓ Valid
                </Box>
              ) : undefined
            }
          />
          {valid && !isHexAddress && resolvedAddress && (
            <Typography
              sx={{
                fontSize: 12,
                color: 'text.secondary',
                mt: 0.75,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              Resolves to {resolvedAddress.slice(0, 6)}…{resolvedAddress.slice(-4)}
            </Typography>
          )}
          {showError && (
            <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.75 }}>Enter a valid address or ENS.</Typography>
          )}
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Name</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              {isKnownContact ? 'From your address book' : 'Optional, shown on the Policies page'}
            </Typography>
          </Stack>
          <WizardField
            icon={<Tag size={16} color="#737373" />}
            value={nickname}
            onChange={setNickname}
            placeholder={isKnownContact ? addressBookName : 'e.g. Ops wallet'}
            ariaLabel="Spender name"
          />
          {valid && !isKnownContact && nickname.trim().length > 0 && (
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ mt: 1, ml: 0.25, cursor: 'pointer' }}
              onClick={() => setSaveToAddressBook(!saveToAddressBook)}
            >
              <Checkbox
                checked={saveToAddressBook}
                onChange={(e) => setSaveToAddressBook(e.target.checked)}
                size="small"
                sx={{ p: 0 }}
                inputProps={{ 'aria-label': 'Save spender to address book' }}
              />
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', userSelect: 'none' }}>
                Save to address book
              </Typography>
            </Stack>
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            padding: '14px 16px',
            borderRadius: '14px',
            backgroundColor: 'background.main',
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck size={16} color="#737373" style={{ flexShrink: 0, marginTop: 2 }} />
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.5 }}>
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              The spender can be anyone.
            </Box>{' '}
            A bot, a teammate, or an external wallet — they don&apos;t have to be a signer. Withdrawals up to the limit
            you set go through with no further approvals from this Safe.
          </Typography>
        </Paper>
      </Stack>
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
        <Stack
          direction="row"
          sx={{
            backgroundColor: 'background.main',
            borderRadius: '12px',
            padding: '4px',
            gap: '4px',
            alignSelf: 'flex-start',
          }}
        >
          {(
            [
              { key: 'recurring', label: 'Recurring', active: period !== 'once' },
              { key: 'once', label: 'One transaction', active: period === 'once' },
            ] as const
          ).map((opt) => (
            <Box
              key={opt.key}
              onClick={() => setPeriod(opt.key === 'once' ? 'once' : period === 'once' ? 'day' : period)}
              sx={{
                minWidth: 130,
                textAlign: 'center',
                py: 0.75,
                px: 2,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '8px',
                backgroundColor: opt.active ? 'background.paper' : 'transparent',
                color: opt.active ? 'text.primary' : 'text.secondary',
                boxShadow: opt.active ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                transition: 'all 150ms',
              }}
            >
              {opt.label}
            </Box>
          ))}
        </Stack>

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
              {period === 'once' ? 'Single-use limit' : 'Limit'}
            </Typography>
            {period === 'once' ? null : (
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
            )}
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
                // Tight 3-significant precision for "0.342 ETH" style output;
                // tiny amounts fall back to 4 decimals so they don't read as 0.
                const display =
                  equiv !== null
                    ? `${equiv.toLocaleString('en-US', {
                        maximumFractionDigits: equiv >= 1 ? 3 : 4,
                      })} ${token.symbol}`
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
                    gap={1}
                    justifyContent={valid ? 'flex-start' : 'space-between'}
                    sx={{
                      py: 1.25,
                      borderBottom: idx === pickedTokens.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {valid ? (
                      <>
                        <TokenLogo token={token} size={22} />
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
                      </>
                    ) : (
                      <Stack direction="row" alignItems="center" gap={1}>
                        <TokenLogo token={token} size={22} />
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{token.symbol}</Typography>
                      </Stack>
                    )}
                    {valid ? null : (
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
                    py: 1,
                    borderTop: idx === 0 ? 'none' : REVIEW_DIVIDER,
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  <EthHashInfo
                    address={owner.value}
                    chainId={chainId}
                    shortAddress
                    avatarSize={22}
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
  const { allSafes, isLoading: safesLoading } = useSpaceSafes()

  const safesList = useMemo<SafeRowItem[]>(() => {
    const out: SafeRowItem[] = []
    for (const item of allSafes ?? []) {
      if (isMultiChainSafeItem(item)) {
        const first = item.safes[0]
        if (first) out.push({ chainId: first.chainId, address: first.address, name: item.name || first.name || '' })
      } else {
        out.push({ chainId: item.chainId, address: item.address, name: item.name || '' })
      }
    }
    return out
  }, [allSafes])

  const rawStep = router.query.step as string | undefined
  const stepKey: StepKey = STEPS.some((s) => s.key === rawStep) ? (rawStep as StepKey) : 'apply-to'
  const currentIndex = STEPS.findIndex((s) => s.key === stepKey)

  const [selectedSafeKey, setSelectedSafeKey] = useState<string>('')
  const selectedSafe = useMemo<SafeRowItem | null>(
    () => safesList.find((s) => safeKey(s) === selectedSafeKey) ?? null,
    [safesList, selectedSafeKey],
  )
  const chainId = selectedSafe?.chainId ?? ''
  const address = selectedSafe?.address ?? ''

  // Hydrate the selection from the URL ?safe=eth:0x… param the first time the
  // Safe list resolves. This keeps the SelectSafeModal entry path working: it
  // navigates here with the Safe already chosen and ?step=wallet.
  const safeParam = (router.query.safe as string) || ''
  useEffect(() => {
    if (selectedSafeKey || !safeParam || safesList.length === 0) return
    const { prefix, address: paramAddress } = parsePrefixedAddress(safeParam)
    const lowerAddr = paramAddress.toLowerCase()
    const match = safesList.find((s) => {
      const chain = chains.find((c) => c.chainId === s.chainId)
      return chain?.shortName === prefix && s.address.toLowerCase() === lowerAddr
    })
    if (match) setSelectedSafeKey(safeKey(match))
  }, [safeParam, safesList, chains, selectedSafeKey])

  const [delegate, setDelegate] = useState('')
  const [delegateNickname, setDelegateNickname] = useState('')
  const [saveDelegateToAddressBook, setSaveDelegateToAddressBook] = useState(true)
  const [pickedTokens, setPickedTokens] = useState<TokenItem[]>([])
  const [customTokens, setCustomTokens] = useState<TokenItem[]>([])
  const [amount, setAmount] = useState(0)
  const [period, setPeriod] = useState<Period>('day')
  const [tokenAmounts, setTokenAmounts] = useState<Record<string, number>>({})

  const setTokenAmount = (address: string, value: number) => {
    setTokenAmounts((prev) => ({ ...prev, [address.toLowerCase()]: value }))
  }

  // Reset wizard state and snap back to step 1 when the user switches Safes mid-flow.
  const prevSelectedSafeKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevSelectedSafeKeyRef.current
    prevSelectedSafeKeyRef.current = selectedSafeKey
    if (!prev || prev === selectedSafeKey) return

    setDelegate('')
    setDelegateNickname('')
    setSaveDelegateToAddressBook(true)
    setPickedTokens([])
    setCustomTokens([])
    setAmount(0)
    setPeriod('day')
    setTokenAmounts({})
  }, [selectedSafeKey])

  const hasLiveRate = (t: TokenItem) => {
    const rate = t.fiatConversion ? Number(t.fiatConversion) : NaN
    return Number.isFinite(rate) && rate > 0
  }

  const tokenAmountFor = (t: TokenItem) => tokenAmounts[t.address.toLowerCase()] ?? 0
  const isTokenPriceable = (t: TokenItem) => (hasLiveRate(t) ? amount > 0 : tokenAmountFor(t) > 0)

  const trimmedDelegate = delegate.trim()
  const isHexDelegate = isAddress(trimmedDelegate)
  // Skip the ENS RPC when the input is already a valid hex address.
  const { address: ensResolvedDelegate, resolving: delegateResolving } = useNameResolver(
    isHexDelegate ? undefined : trimmedDelegate,
  )
  const resolvedDelegate = isHexDelegate ? trimmedDelegate : ensResolvedDelegate
  const isDelegateValid = !!resolvedDelegate

  // Pre-fill nickname when the resolved address is already in the user's address book.
  const delegateContact = useAddressBookItem(resolvedDelegate ?? '', chainId)
  const addressBookName = delegateContact?.name
  useEffect(() => {
    if (addressBookName && !delegateNickname) setDelegateNickname(addressBookName)
  }, [addressBookName, delegateNickname])

  const dispatch = useAppDispatch()
  const { setTxFlow } = useContext(TxModalContext)

  const { buildTxs, isPreparing, error: submitError } = useSubmitPolicy({ chainId, safeAddress: address })

  const goToStep = (key: StepKey) => {
    void router.replace({
      pathname: AppRoutes.spaces.policies,
      query: { ...router.query, step: key },
    })
  }

  const goBack = () => {
    if (currentIndex <= 0) {
      const { policy: _p, step: _s, safe: _sf, ...rest } = router.query
      void router.replace({ pathname: AppRoutes.spaces.policies, query: rest })
      return
    }
    goToStep(STEPS[currentIndex - 1].key)
  }

  const submitPolicy = async () => {
    if (!resolvedDelegate) return
    const txs = await buildTxs({
      delegate: resolvedDelegate,
      amountUsd: amount,
      period,
      tokens: pickedTokens.map((t) => ({
        address: t.address,
        decimals: t.decimals,
        fiatConversion: t.fiatConversion,
        manualAmount: hasLiveRate(t) ? undefined : tokenAmountFor(t),
      })),
    })
    if (!txs) return

    // Switch the URL's active Safe right before handing off — the tx-flow
    // modal reads it via useSafeInfo. This is the ONLY time we touch the
    // global active-safe state, which keeps nested-safe navigation in the
    // Topbar/sidebar from breaking during the wizard.
    const chain = chains.find((c) => c.chainId === chainId)
    if (chain) {
      await router.replace(
        { pathname: router.pathname, query: { ...router.query, safe: `${chain.shortName}:${address}` } },
        undefined,
        { shallow: true },
      )
    }

    // Hand the prebuilt batch off to the standard tx-flow modal — it owns the
    // review screen, Safe Shield co-pilot, simulation, and the sign/propose
    // step. We only need to react to its success callback.
    setTxFlow(
      <PolicyBatchFlow
        txs={txs}
        subtitle="Spending limit"
        onSubmit={(args) => {
          if (!args?.txId) return
          // Persist nickname to the address book if the user opted in and the
          // address isn't already known. Tied to the modal's success path so a
          // dismissal doesn't leave a phantom contact behind.
          const trimmedNick = delegateNickname.trim()
          if (saveDelegateToAddressBook && trimmedNick && !addressBookName && chainId) {
            dispatch(
              upsertAddressBookEntries({
                chainIds: [chainId],
                address: resolvedDelegate,
                name: trimmedNick,
              }),
            )
          }
          const { policy: _p, step: _s, safe: _sf, ...rest } = router.query
          void router.replace({ pathname: AppRoutes.spaces.policies, query: rest })
        }}
      />,
    )
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
    if (stepKey === 'apply-to') return !selectedSafe
    if (stepKey === 'wallet') return !isDelegateValid
    if (stepKey === 'tokens') return pickedTokens.length === 0
    if (stepKey === 'amount') return !pickedTokens.every(isTokenPriceable)
    return false
  })()

  const isReview = stepKey === 'review'

  return (
    <WizardLayout
      wizard={<VerticalWizard steps={STEPS} currentIndex={currentIndex} />}
      form={
        <>
          <FormHeader
            currentIndex={currentIndex}
            onBack={goBack}
            onNext={goNext}
            continueDisabled={continueDisabled}
            isReview={isReview}
            isSubmitting={isPreparing}
          />

          {stepKey === 'apply-to' && (
            <ApplyToStep
              safes={safesList}
              isLoading={safesLoading}
              selectedKey={selectedSafeKey}
              onSelect={(s) => setSelectedSafeKey(safeKey(s))}
            />
          )}

          {stepKey === 'wallet' && (
            <WalletStep
              address={delegate}
              setAddress={setDelegate}
              nickname={delegateNickname}
              setNickname={setDelegateNickname}
              resolvedAddress={resolvedDelegate}
              resolving={delegateResolving}
              isHexAddress={isHexDelegate}
              addressBookName={addressBookName}
              saveToAddressBook={saveDelegateToAddressBook}
              setSaveToAddressBook={setSaveDelegateToAddressBook}
            />
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
              delegate={resolvedDelegate ?? ''}
              tokens={pickedTokens}
              amount={amount}
              period={period}
              tokenAmounts={tokenAmounts}
              submitError={submitError}
            />
          )}
        </>
      }
      summary={
        <PolicySummary
          chainId={chainId}
          safeAddress={address}
          delegate={resolvedDelegate ?? ''}
          delegateNickname={delegateNickname}
          pickedTokens={pickedTokens}
          amount={amount}
          period={period}
          tokenAmounts={tokenAmounts}
        />
      }
    />
  )
}

export default SpendingLimitFlow
