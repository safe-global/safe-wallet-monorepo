import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Checkbox, InputBase, Paper, Stack, Typography } from '@mui/material'
import { isAddress } from 'ethers'
import { CalendarClock, Clock, Loader2, ScrollText, ShieldCheck, Sparkles, Tag, Wallet } from 'lucide-react'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeIdenticon, ShortAddressWithTooltip } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import { AppRoutes } from '@/config/routes'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem } from '@/hooks/safes/useAllSafesGrouped'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import { getRecoveryUpsertTransactions } from '@/features/recovery/services'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import {
  ApplyToStep,
  FormHeader,
  OptionCard,
  PolicySummaryRow,
  VerticalWizard,
  WizardField,
  WizardLayout,
  safeKey,
  type SafeRowItem,
} from '../wizardCommon'

const STEPS = [
  { key: 'apply-to', label: 'Apply to' },
  { key: 'recoverer', label: 'Recoverer' },
  { key: 'cooldown', label: 'Cooldown' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'review', label: 'Review' },
] as const

type StepKey = (typeof STEPS)[number]['key']

type CooldownKey = '24h' | '7d' | '14d' | '28d' | '60d' | 'custom'
type ExpiryKey = 'never' | '6m' | '1y' | 'custom'

const COOLDOWN_OPTIONS: { key: CooldownKey; title: string; description: string; recommended?: boolean }[] = [
  { key: '24h', title: '24 hours', description: 'Emergencies only.' },
  { key: '7d', title: '7 days', description: 'Fast, risky if off-grid.' },
  { key: '14d', title: '14 days', description: 'Balanced for small teams.' },
  { key: '28d', title: '28 days', description: 'Enough time to catch an attack.', recommended: true },
  { key: '60d', title: '60 days', description: 'Maximum caution.' },
  { key: 'custom', title: 'Custom', description: 'Set your own.' },
]

const COOLDOWN_LABELS: Record<CooldownKey, string> = {
  '24h': '24 hours',
  '7d': '7 days',
  '14d': '14 days',
  '28d': '28 days',
  '60d': '60 days',
  custom: 'Custom',
}

const EXPIRY_OPTIONS: { key: ExpiryKey; title: string; description: string; recommended?: boolean }[] = [
  { key: 'never', title: 'Never', description: 'Active until removed.', recommended: true },
  { key: '6m', title: '6 months', description: 'Temporary arrangements.' },
  { key: '1y', title: '1 year', description: 'Revisit annually.' },
  { key: 'custom', title: 'Custom date', description: 'Pick a specific date.' },
]

const EXPIRY_LABELS: Record<ExpiryKey, string> = {
  never: 'Never',
  '6m': '6 months',
  '1y': '1 year',
  custom: 'Custom',
}

const EXPIRY_VERBOSE: Record<ExpiryKey, string> = {
  never: 'never expires',
  '6m': 'expires after 6 months',
  '1y': 'expires after 1 year',
  custom: 'expires on the date you set',
}

const DAY_IN_SECONDS = 60 * 60 * 24

// Seconds the Delay Modifier should use for each named option. Custom is handled
// at submit time using customCooldownDays.
const COOLDOWN_SECONDS: Record<Exclude<CooldownKey, 'custom'>, number> = {
  '24h': DAY_IN_SECONDS,
  '7d': 7 * DAY_IN_SECONDS,
  '14d': 14 * DAY_IN_SECONDS,
  '28d': 28 * DAY_IN_SECONDS,
  '60d': 60 * DAY_IN_SECONDS,
}

// On-chain "expiry" is the proposal lifetime in seconds. Map the wizard's
// user-friendly options to seconds; 'never' = 0 (the contract treats 0 as no
// expiry). Custom date is converted at submit time to a duration-from-now.
const EXPIRY_SECONDS: Record<Exclude<ExpiryKey, 'custom'>, number> = {
  never: 0,
  '6m': 180 * DAY_IN_SECONDS,
  '1y': 365 * DAY_IN_SECONDS,
}

type RecovererStepProps = {
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

const RecovererStep = ({
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
}: RecovererStepProps) => {
  const trimmed = address.trim()
  const valid = !!resolvedAddress
  const isEmpty = trimmed.length === 0
  // Only flag as invalid once we've actually finished trying (skip while resolving).
  const showError = !isEmpty && !valid && !resolving
  const isKnownContact = valid && !!addressBookName

  return (
    <>
      <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
        Who can recover this Safe?
      </Typography>

      <Stack gap={2.5}>
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Recoverer address</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>ENS supported</Typography>
          </Stack>
          <WizardField
            icon={<Wallet size={16} color="#1C5538" />}
            iconBg="accent"
            value={address}
            onChange={setAddress}
            placeholder="0x… or name.eth"
            state={showError ? 'error' : valid ? 'valid' : 'default'}
            ariaLabel="Recoverer address"
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
            placeholder={isKnownContact ? addressBookName : 'e.g. Backup wallet'}
            ariaLabel="Recoverer name"
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
                inputProps={{ 'aria-label': 'Save recoverer to address book' }}
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
              Pick an address you can always access.
            </Box>{' '}
            A hardware wallet in a physical safe, a trusted law firm, or another Safe you control. Workspace members are
            a weaker choice — if your laptop is compromised, theirs might be too.
          </Typography>
        </Paper>
      </Stack>
    </>
  )
}

type CooldownStepProps = {
  value: CooldownKey
  onChange: (v: CooldownKey) => void
  customDays: string
  setCustomDays: (v: string) => void
}

const CustomDaysInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.75 }} onClick={(e) => e.stopPropagation()}>
    <InputBase
      type="number"
      value={value}
      onChange={(e) => {
        const raw = e.target.value
        // Allow empty; otherwise keep non-negative integers.
        if (raw === '') return onChange('')
        const n = parseInt(raw, 10)
        if (!Number.isFinite(n) || n < 0) return
        onChange(String(n))
      }}
      onClick={(e) => e.stopPropagation()}
      autoFocus
      placeholder="0"
      inputProps={{ inputMode: 'numeric', min: 1, 'aria-label': 'Custom number of days' }}
      sx={{
        width: 72,
        padding: '4px 10px',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'border.light',
        backgroundColor: 'background.paper',
        fontSize: 13,
        fontWeight: 600,
        color: 'text.primary',
        fontVariantNumeric: 'tabular-nums',
        '&:focus-within': {
          borderColor: 'text.primary',
        },
        '& input': { padding: 0, textAlign: 'right' },
      }}
    />
    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{value === '1' ? 'day' : 'days'}</Typography>
  </Stack>
)

const CooldownStep = ({ value, onChange, customDays, setCustomDays }: CooldownStepProps) => (
  <>
    <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
      How long is the review window?
    </Typography>

    <Stack gap={0.5}>
      {COOLDOWN_OPTIONS.map((opt) => {
        const selected = value === opt.key
        const isCustomRow = opt.key === 'custom'
        return (
          <OptionCard
            key={opt.key}
            title={opt.title}
            description={
              isCustomRow && selected ? (
                <CustomDaysInput value={customDays} onChange={setCustomDays} />
              ) : (
                opt.description
              )
            }
            selected={selected}
            recommended={opt.recommended}
            onClick={() => onChange(opt.key)}
          />
        )
      })}
    </Stack>
  </>
)

type ExpiryStepProps = {
  value: ExpiryKey
  onChange: (v: ExpiryKey) => void
  customDate: string
  setCustomDate: (v: string) => void
}

const CustomDateInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  // Lock the picker to tomorrow-or-later so users can't set a past expiry.
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minISO = tomorrow.toISOString().slice(0, 10)

  return (
    <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.75 }} onClick={(e) => e.stopPropagation()}>
      <InputBase
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        inputProps={{ min: minISO, 'aria-label': 'Custom expiry date' }}
        sx={{
          padding: '4px 10px',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'border.light',
          backgroundColor: 'background.paper',
          fontSize: 13,
          fontWeight: 600,
          color: 'text.primary',
          fontVariantNumeric: 'tabular-nums',
          '&:focus-within': { borderColor: 'text.primary' },
          '& input': { padding: 0 },
        }}
      />
    </Stack>
  )
}

const ExpiryStep = ({ value, onChange, customDate, setCustomDate }: ExpiryStepProps) => (
  <>
    <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
      When does this expire?
    </Typography>

    <Stack gap={0.5}>
      {EXPIRY_OPTIONS.map((opt) => {
        const selected = value === opt.key
        const isCustomRow = opt.key === 'custom'
        return (
          <OptionCard
            key={opt.key}
            title={opt.title}
            description={
              isCustomRow && selected ? (
                <CustomDateInput value={customDate} onChange={setCustomDate} />
              ) : (
                opt.description
              )
            }
            selected={selected}
            recommended={opt.recommended}
            onClick={() => onChange(opt.key)}
          />
        )
      })}
    </Stack>
  </>
)

type ReviewStepProps = {
  safe: SafeRowItem | null
  recovererAddress: string
  recovererNickname: string
  cooldownLabel: string
  expiryLabel: string
  expiryVerbose: string
  submitError: string | null
}

const ReviewStep = ({
  safe,
  recovererAddress,
  recovererNickname,
  cooldownLabel,
  expiryLabel,
  expiryVerbose,
  submitError,
}: ReviewStepProps) => {
  const shortRecoverer = recovererAddress
    ? `${recovererAddress.slice(0, 6)}…${recovererAddress.slice(-4)}`
    : 'the recoverer'
  const recovererName = recovererNickname.trim() || shortRecoverer
  const safeName = safe?.name?.trim() || 'this Safe'

  return (
    <>
      <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
        Ready to sign?
      </Typography>

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(18, 255, 128, 0.08) 0%, rgba(18, 255, 128, 0.015) 100%)',
          borderRadius: '18px',
          padding: '24px 22px',
          mb: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={0.75}
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: 'success.dark',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            mb: 1.5,
          }}
        >
          <Sparkles size={12} />
          This recovery policy will do
        </Stack>
        <Typography
          sx={{
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: '-0.1px',
            '& strong': { fontWeight: 700 },
          }}
        >
          <strong>{recovererName}</strong>
          {recovererNickname && recovererAddress ? ` (${shortRecoverer})` : ''} can recover <strong>{safeName}</strong>.
          They can propose a signer rotation, which executes after a <strong>{cooldownLabel}</strong> review window.
          This option <strong>{expiryVerbose}</strong>.
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        }}
      >
        <ReviewDetailCell
          label="Safe"
          icon={safe ? <SafeIdenticon address={safe.address} size={28} /> : <Box sx={{ width: 28, height: 28 }} />}
          value={safeName}
        />
        <ReviewDetailCell
          label="Recoverer"
          icon={
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                backgroundColor: 'secondary.background',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={14} color="#1C5538" />
            </Box>
          }
          value={recovererName}
          subValue={recovererAddress ? shortRecoverer : undefined}
        />
        <ReviewDetailCell label="Review window" icon={<Clock size={16} color="#737373" />} value={cooldownLabel} />
        <ReviewDetailCell label="Expires" icon={<CalendarClock size={16} color="#737373" />} value={expiryLabel} />
        <Box sx={{ gridColumn: { sm: '1 / -1' }, padding: '14px 18px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              mb: 0.5,
            }}
          >
            Enforced by
          </Typography>
          <Stack direction="row" alignItems="center" gap={1}>
            <ShieldCheck size={14} color="#1C5538" />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Safe Delay Modifier</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>· Audited, on-chain enforced</Typography>
          </Stack>
        </Box>
      </Paper>

      {submitError && (
        <Typography sx={{ fontSize: 12, color: 'error.main', mt: 2, lineHeight: 1.5 }}>{submitError}</Typography>
      )}
    </>
  )
}

type ReviewDetailCellProps = {
  label: string
  icon: React.ReactNode
  value: string
  subValue?: string
}

const ReviewDetailCell = ({ label, icon, value, subValue }: ReviewDetailCellProps) => (
  <Box sx={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        mb: 0.75,
      }}
    >
      {label}
    </Typography>
    <Stack direction="row" alignItems="center" gap={1}>
      {icon}
      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{value}</Typography>
      {subValue && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'ui-monospace, monospace' }}>
          {subValue}
        </Typography>
      )}
    </Stack>
  </Box>
)

type RecoveryPolicySummaryProps = {
  safe: SafeRowItem | null
  recovererAddress: string
  recovererNickname: string
  cooldownLabel: string | null
  expiryLabel: string | null
}

const RecoveryPolicySummary = ({
  safe,
  recovererAddress,
  recovererNickname,
  cooldownLabel,
  expiryLabel,
}: RecoveryPolicySummaryProps) => {
  const hasSafe = !!safe
  const hasRecoverer = isAddress(recovererAddress.trim())
  const hasCooldown = !!cooldownLabel
  const hasExpiry = !!expiryLabel

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
        label="Safe"
        pending={!hasSafe}
        value={
          hasSafe ? (
            <Stack direction="row" alignItems="center" gap={0.75}>
              <SafeIdenticon address={safe.address} size={22} />
              <Stack sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{safe.name || 'Safe'}</Typography>
                <ShortAddressWithTooltip address={safe.address} />
              </Stack>
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>Not set</Typography>
          )
        }
      />

      <PolicySummaryRow
        label="Recoverer"
        pending={!hasRecoverer}
        value={
          hasRecoverer ? (
            <Stack sx={{ minWidth: 0 }}>
              {recovererNickname.trim() && (
                <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
                  {recovererNickname.trim()}
                </Typography>
              )}
              <EthHashInfo
                address={recovererAddress.trim()}
                shortAddress
                avatarSize={recovererNickname.trim() ? 0 : 20}
                showCopyButton={false}
              />
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>Not set</Typography>
          )
        }
      />

      <PolicySummaryRow
        label="Cooldown"
        pending={!hasCooldown}
        value={
          hasCooldown ? (
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{cooldownLabel}</Typography>
          ) : (
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>—</Typography>
          )
        }
      />

      <PolicySummaryRow
        label="Expires"
        pending={!hasExpiry}
        value={
          hasExpiry ? (
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{expiryLabel}</Typography>
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
          Enforced by Safe Delay Modifier
        </Stack>
      </Box>
    </Paper>
  )
}

const RecoveryFlow = () => {
  const router = useRouter()
  const { allSafes, isLoading } = useSpaceSafes()

  const rawStep = router.query.step as string | undefined
  const stepKey: StepKey = STEPS.some((s) => s.key === rawStep) ? (rawStep as StepKey) : 'apply-to'
  const currentIndex = STEPS.findIndex((s) => s.key === stepKey)

  const safesList = useMemo<SafeRowItem[]>(() => {
    const out: SafeRowItem[] = []
    for (const item of allSafes ?? []) {
      if (isMultiChainSafeItem(item)) {
        // Collapse a multi-chain safe to its first chain — the recovery module deploys per chain.
        const first = item.safes[0]
        if (first) out.push({ chainId: first.chainId, address: first.address, name: item.name || first.name || '' })
      } else {
        out.push({ chainId: item.chainId, address: item.address, name: item.name || '' })
      }
    }
    return out
  }, [allSafes])

  const [selectedSafeKey, setSelectedSafeKey] = useState<string>('')
  const selectedSafe = useMemo<SafeRowItem | null>(
    () => safesList.find((s) => safeKey(s) === selectedSafeKey) ?? null,
    [safesList, selectedSafeKey],
  )

  const { configs: chains } = useChains()

  const [recovererAddress, setRecovererAddress] = useState('')
  const [recovererNickname, setRecovererNickname] = useState('')
  const [saveRecovererToAddressBook, setSaveRecovererToAddressBook] = useState(true)
  const [cooldown, setCooldown] = useState<CooldownKey | null>(null)
  const [customCooldownDays, setCustomCooldownDays] = useState('')
  const [expiry, setExpiry] = useState<ExpiryKey | null>(null)
  const [customExpiryDate, setCustomExpiryDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const trimmedRecoverer = recovererAddress.trim()
  const isHexRecoverer = isAddress(trimmedRecoverer)
  // Only resolve ENS when the input isn't already a hex address — avoids unnecessary RPC calls.
  const { address: ensResolved, resolving: ensResolving } = useNameResolver(
    isHexRecoverer ? undefined : trimmedRecoverer,
  )
  const resolvedRecoverer = isHexRecoverer ? trimmedRecoverer : ensResolved
  const isRecovererValid = !!resolvedRecoverer

  // Pre-fill nickname if the resolved address already lives in the user's address book on this chain.
  const recovererContact = useAddressBookItem(resolvedRecoverer ?? '', selectedSafe?.chainId)
  const recovererAddressBookName = recovererContact?.name
  useEffect(() => {
    if (recovererAddressBookName && !recovererNickname) setRecovererNickname(recovererAddressBookName)
  }, [recovererAddressBookName, recovererNickname])

  const dispatch = useAppDispatch()
  const { setTxFlow } = useContext(TxModalContext)

  // Auto-suggest defaults on first reach: recommended cooldown = 28d, expiry = never.
  // Only fills if user hasn't picked yet. Lets the right column light up after the user
  // visits the step without overriding their choice.
  const cooldownTouched = useRef(false)
  const expiryTouched = useRef(false)
  useEffect(() => {
    if (stepKey === 'cooldown' && cooldown === null && !cooldownTouched.current) {
      setCooldown('28d')
    }
    if (stepKey === 'expiry' && expiry === null && !expiryTouched.current) {
      setExpiry('never')
    }
  }, [stepKey, cooldown, expiry])

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
    if (!resolvedRecoverer || !selectedSafe) return
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const chain = chains.find((c) => c.chainId === selectedSafe.chainId)
      if (!chain) throw new Error(`Chain ${selectedSafe.chainId} is not supported`)

      const customCooldownSec = (() => {
        const n = parseInt(customCooldownDays, 10)
        return Number.isFinite(n) && n > 0 ? n * DAY_IN_SECONDS : 0
      })()
      const delaySec = cooldown === 'custom' ? customCooldownSec : cooldown ? COOLDOWN_SECONDS[cooldown] : 0
      if (delaySec <= 0) {
        throw new Error('Pick a cooldown period before continuing')
      }

      const customExpirySec = (() => {
        if (!customExpiryDate) return 0
        const ms = new Date(customExpiryDate).getTime() - Date.now()
        return ms > 0 ? Math.floor(ms / 1000) : 0
      })()
      const expirySec = expiry === 'custom' ? customExpirySec : expiry ? EXPIRY_SECONDS[expiry] : 0

      // Build with a chain-pure provider so we don't rely on the global
      // active-safe context being switched (which would re-fetch safe info
      // and break nested-safe navigation).
      const provider = createWeb3ReadOnly(chain)
      if (!provider) throw new Error(`No RPC available for chain ${chain.chainName}`)

      const txs = await getRecoveryUpsertTransactions({
        recoverer: resolvedRecoverer,
        delay: String(delaySec),
        expiry: String(expirySec),
        customDelay: '',
        selectedDelay: String(delaySec),
        provider,
        chainId: selectedSafe.chainId,
        safeAddress: selectedSafe.address,
      })

      // Switch the URL's active Safe right before handing off — the tx-flow
      // modal reads it via useSafeInfo. This is the ONLY time we touch the
      // global active-safe state.
      await router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, safe: `${chain.shortName}:${selectedSafe.address}` },
        },
        undefined,
        { shallow: true },
      )

      // Hand the prebuilt batch off to the standard tx-flow modal — review,
      // Safe Shield, simulation, and the sign/propose step are all owned by
      // it. We only react to the success callback (address-book save +
      // redirect).
      setTxFlow(
        <PolicyBatchFlow
          txs={txs}
          subtitle="Account recovery"
          onSubmit={(args) => {
            if (!args?.txId) return
            const trimmedNick = recovererNickname.trim()
            if (
              saveRecovererToAddressBook &&
              trimmedNick &&
              !recovererAddressBookName &&
              resolvedRecoverer &&
              selectedSafe.chainId
            ) {
              dispatch(
                upsertAddressBookEntries({
                  chainIds: [selectedSafe.chainId],
                  address: resolvedRecoverer,
                  name: trimmedNick,
                }),
              )
            }
            const { policy: _p, step: _s, safe: _sf, ...rest } = router.query
            void router.replace({ pathname: AppRoutes.spaces.policies, query: rest })
          }}
        />,
      )
    } catch (e) {
      setSubmitError(asError(e).message)
    } finally {
      setIsSubmitting(false)
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

  const customCooldownNum = parseInt(customCooldownDays, 10)
  const isCustomCooldownValid = Number.isFinite(customCooldownNum) && customCooldownNum > 0

  const cooldownDisplay =
    cooldown === 'custom'
      ? isCustomCooldownValid
        ? `${customCooldownNum} ${customCooldownNum === 1 ? 'day' : 'days'}`
        : 'Custom'
      : cooldown
        ? COOLDOWN_LABELS[cooldown]
        : 'Custom'

  const parsedExpiryDate = customExpiryDate ? new Date(customExpiryDate) : null
  const isCustomExpiryValid =
    !!parsedExpiryDate && !Number.isNaN(parsedExpiryDate.getTime()) && parsedExpiryDate > new Date()
  const formattedExpiryDate = isCustomExpiryValid
    ? parsedExpiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  const expiryDisplay =
    expiry === 'custom'
      ? isCustomExpiryValid
        ? formattedExpiryDate
        : 'Custom'
      : expiry
        ? EXPIRY_LABELS[expiry]
        : 'Custom'

  const expiryVerbose =
    expiry === 'custom'
      ? isCustomExpiryValid
        ? `expires on ${formattedExpiryDate}`
        : 'expires on the date you set'
      : expiry
        ? EXPIRY_VERBOSE[expiry]
        : 'expires on the date you set'

  const continueDisabled = (() => {
    if (stepKey === 'apply-to') return !selectedSafe
    if (stepKey === 'recoverer') return !isRecovererValid
    if (stepKey === 'cooldown') {
      if (cooldown === null) return true
      if (cooldown === 'custom') return !isCustomCooldownValid
      return false
    }
    if (stepKey === 'expiry') {
      if (expiry === null) return true
      if (expiry === 'custom') return !isCustomExpiryValid
      return false
    }
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
            isSubmitting={isSubmitting}
          />

          {stepKey === 'apply-to' && (
            <ApplyToStep
              safes={safesList}
              isLoading={isLoading}
              selectedKey={selectedSafeKey}
              onSelect={(s) => setSelectedSafeKey(safeKey(s))}
            />
          )}

          {stepKey === 'recoverer' && (
            <RecovererStep
              address={recovererAddress}
              setAddress={setRecovererAddress}
              nickname={recovererNickname}
              setNickname={setRecovererNickname}
              resolvedAddress={resolvedRecoverer}
              resolving={ensResolving}
              isHexAddress={isHexRecoverer}
              addressBookName={recovererAddressBookName}
              saveToAddressBook={saveRecovererToAddressBook}
              setSaveToAddressBook={setSaveRecovererToAddressBook}
            />
          )}

          {stepKey === 'cooldown' && (
            <CooldownStep
              value={cooldown ?? '28d'}
              onChange={(v) => {
                cooldownTouched.current = true
                setCooldown(v)
              }}
              customDays={customCooldownDays}
              setCustomDays={setCustomCooldownDays}
            />
          )}

          {stepKey === 'expiry' && (
            <ExpiryStep
              value={expiry ?? 'never'}
              onChange={(v) => {
                expiryTouched.current = true
                setExpiry(v)
              }}
              customDate={customExpiryDate}
              setCustomDate={setCustomExpiryDate}
            />
          )}

          {stepKey === 'review' && (
            <ReviewStep
              safe={selectedSafe}
              recovererAddress={resolvedRecoverer ?? ''}
              recovererNickname={recovererNickname}
              cooldownLabel={cooldownDisplay}
              expiryLabel={expiryDisplay}
              expiryVerbose={expiryVerbose}
              submitError={submitError}
            />
          )}
        </>
      }
      summary={
        <RecoveryPolicySummary
          safe={selectedSafe}
          recovererAddress={resolvedRecoverer ?? ''}
          recovererNickname={recovererNickname}
          cooldownLabel={
            cooldown === null || (cooldown === 'custom' && !isCustomCooldownValid) ? null : cooldownDisplay
          }
          expiryLabel={expiry === null || (expiry === 'custom' && !isCustomExpiryValid) ? null : expiryDisplay}
        />
      }
    />
  )
}

export default RecoveryFlow
