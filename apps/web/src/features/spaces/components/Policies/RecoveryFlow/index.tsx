import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Input } from '@safe-global/views/components/ui/input'
import { Typography } from '@safe-global/views/components/ui/typography'
import { isAddress } from 'ethers'
import { CalendarClock, Clock, Loader2, ScrollText, ShieldCheck, Sparkles, Tag, Wallet } from 'lucide-react'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import EthHashInfo from '@/components/common/EthHashInfo'
import { SafeIdenticon, ShortAddressWithTooltip } from '../shared/safeIdentity'
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

const ALL_STEPS = [
  { key: 'apply-to', label: 'Apply to' },
  { key: 'recoverer', label: 'Recoverer' },
  { key: 'cooldown', label: 'Cooldown' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'review', label: 'Review' },
] as const

type StepKey = (typeof ALL_STEPS)[number]['key']

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
      <Typography variant="h3" className="mb-5 tracking-tight">
        Who can recover this Safe?
      </Typography>

      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-2 flex flex-row items-center justify-between">
            <Typography variant="paragraph-small-bold">Recoverer address</Typography>
            <Typography variant="paragraph-mini" className="text-muted-foreground">
              ENS supported
            </Typography>
          </div>
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
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-[var(--color-background-main)] font-semibold text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" />
                  Resolving…
                </div>
              ) : valid ? (
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-accent font-bold text-success-strong">
                  ✓ Valid
                </div>
              ) : undefined
            }
          />
          {valid && !isHexAddress && resolvedAddress && (
            <Typography variant="paragraph-mini" className="mt-1.5 block font-mono text-muted-foreground">
              Resolves to {resolvedAddress.slice(0, 6)}…{resolvedAddress.slice(-4)}
            </Typography>
          )}
          {showError && (
            <Typography variant="paragraph-mini" className="mt-1.5 block text-destructive">
              Enter a valid address or ENS.
            </Typography>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-row items-center justify-between">
            <Typography variant="paragraph-small-bold">Name</Typography>
            <Typography variant="paragraph-mini" className="text-muted-foreground">
              {isKnownContact ? 'From your address book' : 'Optional, shown on the Policies page'}
            </Typography>
          </div>
          <WizardField
            icon={<Tag size={16} color="#737373" />}
            value={nickname}
            onChange={setNickname}
            placeholder={isKnownContact ? addressBookName : 'e.g. Backup wallet'}
            ariaLabel="Recoverer name"
          />
          {valid && !isKnownContact && nickname.trim().length > 0 && (
            <div
              className="mt-2 ml-0.5 flex cursor-pointer flex-row items-center gap-2"
              onClick={() => setSaveToAddressBook(!saveToAddressBook)}
            >
              <Checkbox
                checked={saveToAddressBook}
                onCheckedChange={(checked) => setSaveToAddressBook(checked === true)}
                aria-label="Save recoverer to address book"
              />
              <Typography variant="paragraph-mini" className="text-muted-foreground select-none">
                Save to address book
              </Typography>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-background-main)] px-4 py-3.5">
          <ShieldCheck size={16} color="#737373" style={{ flexShrink: 0, marginTop: 2 }} />
          <Typography variant="paragraph-mini" className="leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">Pick an address you can always access.</span> A hardware wallet
            in a physical safe, a trusted law firm, or another Safe you control. Workspace members are a weaker choice —
            if your laptop is compromised, theirs might be too.
          </Typography>
        </div>
      </div>
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
  <div className="mt-1.5 flex flex-row items-center gap-2" onClick={(e) => e.stopPropagation()}>
    <Input
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
      inputMode="numeric"
      min={1}
      aria-label="Custom number of days"
      inputSize="sm"
      variant="surface"
      className="w-18 text-right font-semibold tabular-nums"
    />
    <Typography variant="paragraph-mini" className="text-muted-foreground">
      {value === '1' ? 'day' : 'days'}
    </Typography>
  </div>
)

const CooldownStep = ({ value, onChange, customDays, setCustomDays }: CooldownStepProps) => (
  <>
    <Typography variant="h3" className="mb-5 tracking-tight">
      How long is the review window?
    </Typography>

    <div className="flex flex-col gap-1">
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
    </div>
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
    <div className="mt-1.5 flex flex-row items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        min={minISO}
        aria-label="Custom expiry date"
        inputSize="sm"
        variant="surface"
        className="font-semibold tabular-nums"
      />
    </div>
  )
}

const ExpiryStep = ({ value, onChange, customDate, setCustomDate }: ExpiryStepProps) => (
  <>
    <Typography variant="h3" className="mb-5 tracking-tight">
      When does this expire?
    </Typography>

    <div className="flex flex-col gap-1">
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
    </div>
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
      <Typography variant="h3" className="mb-5 tracking-tight">
        Ready to sign?
      </Typography>

      <div className="relative mb-4 overflow-hidden rounded-[18px] bg-linear-to-b from-[rgba(18,255,128,0.08)] to-[rgba(18,255,128,0.015)] px-5.5 py-6">
        <div className="mb-3 flex flex-row items-center gap-1.5 text-[11px] font-bold tracking-widest text-success-strong uppercase">
          <Sparkles size={12} />
          This recovery policy will do
        </div>
        <Typography variant="paragraph" className="leading-relaxed tracking-tight [&_strong]:font-bold">
          <strong>{recovererName}</strong>
          {recovererNickname && recovererAddress ? ` (${shortRecoverer})` : ''} can recover <strong>{safeName}</strong>.
          They can propose a signer rotation, which executes after a <strong>{cooldownLabel}</strong> review window.
          This option <strong>{expiryVerbose}</strong>.
        </Typography>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-[18px] sm:grid-cols-2">
        <ReviewDetailCell
          label="Safe"
          icon={safe ? <SafeIdenticon address={safe.address} size={28} /> : <div className="size-7" />}
          value={safeName}
        />
        <ReviewDetailCell
          label="Recoverer"
          icon={
            <div className="flex size-7 items-center justify-center rounded-lg bg-accent">
              <Wallet size={14} color="#1C5538" />
            </div>
          }
          value={recovererName}
          subValue={recovererAddress ? shortRecoverer : undefined}
        />
        <ReviewDetailCell label="Review window" icon={<Clock size={16} color="#737373" />} value={cooldownLabel} />
        <ReviewDetailCell label="Expires" icon={<CalendarClock size={16} color="#737373" />} value={expiryLabel} />
        <div className="border-t border-border px-4.5 py-3.5 sm:col-span-full">
          <Typography
            variant="paragraph-mini-medium"
            className="block tracking-wider text-muted-foreground uppercase mb-1"
          >
            Enforced by
          </Typography>
          <div className="flex flex-row items-center gap-2">
            <ShieldCheck size={14} color="#1C5538" />
            <Typography variant="paragraph-small-bold">Safe Delay Modifier</Typography>
            <Typography variant="paragraph-mini" className="text-muted-foreground">
              · Audited, on-chain enforced
            </Typography>
          </div>
        </div>
      </div>

      {submitError && (
        <Typography variant="paragraph-mini" className="mt-4 block leading-relaxed text-destructive">
          {submitError}
        </Typography>
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
  <div className="border-b border-border px-4.5 py-3.5">
    <Typography variant="paragraph-mini-medium" className="block tracking-wider text-muted-foreground uppercase mb-1.5">
      {label}
    </Typography>
    <div className="flex flex-row items-center gap-2">
      {icon}
      <Typography variant="paragraph-small-bold">{value}</Typography>
      {subValue && (
        <Typography variant="paragraph-mini" className="font-mono text-muted-foreground">
          {subValue}
        </Typography>
      )}
    </div>
  </div>
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
    <div className="sticky top-6 rounded-[18px] bg-card p-6">
      <div className="flex flex-row items-center gap-2 px-1 pb-2.5">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-[var(--color-background-main)]">
          <ScrollText size={13} />
        </div>
        <Typography variant="paragraph-small-bold">Policy summary</Typography>
      </div>

      <PolicySummaryRow
        isFirst
        label="Safe"
        pending={!hasSafe}
        value={
          hasSafe ? (
            <div className="flex flex-row items-center gap-1.5">
              <SafeIdenticon address={safe.address} size={22} />
              <div className="flex min-w-0 flex-col">
                <Typography variant="paragraph-small-bold" className="leading-tight">
                  {safe.name || 'Safe'}
                </Typography>
                <ShortAddressWithTooltip address={safe.address} />
              </div>
            </div>
          ) : (
            <Typography variant="paragraph-small" className="text-muted-foreground">
              Not set
            </Typography>
          )
        }
      />

      <PolicySummaryRow
        label="Recoverer"
        pending={!hasRecoverer}
        value={
          hasRecoverer ? (
            <div className="flex min-w-0 flex-col">
              {recovererNickname.trim() && (
                <Typography variant="paragraph-small-bold" className="leading-snug">
                  {recovererNickname.trim()}
                </Typography>
              )}
              <EthHashInfo
                address={recovererAddress.trim()}
                shortAddress
                avatarSize={recovererNickname.trim() ? 0 : 20}
                showCopyButton={false}
              />
            </div>
          ) : (
            <Typography variant="paragraph-small" className="text-muted-foreground">
              Not set
            </Typography>
          )
        }
      />

      <PolicySummaryRow
        label="Cooldown"
        pending={!hasCooldown}
        value={
          hasCooldown ? (
            <Typography variant="paragraph-small-bold">{cooldownLabel}</Typography>
          ) : (
            <Typography variant="paragraph-small" className="text-muted-foreground">
              —
            </Typography>
          )
        }
      />

      <PolicySummaryRow
        label="Expires"
        pending={!hasExpiry}
        value={
          hasExpiry ? (
            <Typography variant="paragraph-small-bold">{expiryLabel}</Typography>
          ) : (
            <Typography variant="paragraph-small" className="text-muted-foreground">
              —
            </Typography>
          )
        }
      />

      <div className="mt-1.5 border-t border-border px-1 pt-2.5">
        <div className="flex flex-row items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <ShieldCheck size={12} color="#1C5538" />
          Enforced by Safe Delay Modifier
        </div>
      </div>
    </div>
  )
}

const RecoveryFlow = () => {
  const router = useRouter()
  const { allSafes, isLoading } = useSpaceSafes()

  // The policies page picks the Safe before opening the wizard, so the Safe step is
  // dropped rather than shown pre-answered.
  const preselectedSafeKey = typeof router.query.policySafe === 'string' ? router.query.policySafe.toLowerCase() : ''
  const STEPS = useMemo(
    () => (preselectedSafeKey ? ALL_STEPS.filter((step) => step.key !== 'apply-to') : ALL_STEPS),
    [preselectedSafeKey],
  )

  const rawStep = router.query.step as string | undefined
  const stepKey: StepKey = STEPS.some((s) => s.key === rawStep) ? (rawStep as StepKey) : STEPS[0].key
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

  const [selectedSafeKey, setSelectedSafeKey] = useState<string>(preselectedSafeKey)
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
      const { policy: _p, step: _s, policySafe: _ps, ...rest } = router.query
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
            const { policy: _p, step: _s, safe: _sf, policySafe: _ps, ...rest } = router.query
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
