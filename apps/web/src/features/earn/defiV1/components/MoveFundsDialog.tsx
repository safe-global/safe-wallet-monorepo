import { Children, Fragment, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  Check,
  CheckCircle2,
  Circle,
  Coins,
  Info,
  KeyRound,
  Orbit,
  Repeat2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Field, FieldContent, FieldLabel, FieldTitle } from '@safe-global/views/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@safe-global/views/components/ui/select'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatAmount, formatUsd } from '../copy'
import { CHAIN_IDS, IDLE_CASH } from '../opportunities'
import type { Slice } from '../shelf'
import { ChainLogo } from './TreasuryTables'

export type MoveMode = 'swap' | 'bridge'
type Step = 'details' | 'review' | 'proposed'
type Route = 'best' | 'fast'
type Expiry = keyof typeof COPY.expiries

const COPY = DEFI_V1_COPY.move
const BODY_HEIGHT = 'h-[min(30rem,65vh)]'
const ICONS: Record<MoveMode, LucideIcon> = { swap: Repeat2, bridge: Orbit }
const CHAINS = Object.keys(CHAIN_IDS)
const STABLES = ['USDC', 'USDT']
const SLIPPAGES = ['auto', '0.1', '1']
// Mock data for the prototype; real quotes, fees and Safe lookups come from the providers and the backend.
const PRICES: Record<string, number> = { USDC: 1, USDT: 1, ETH: 3_200 }
const DEPLOYED_ON = ['Base', 'Ethereum']
const ROUTE_FEES: Record<Route, number> = { best: 12, fast: 25 }

const parseAmount = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0
const priceOf = (asset: string) => PRICES[asset] ?? 1
const formatToken = (value: number) => (value >= 1 ? formatAmount(value) : String(Number(value.toPrecision(3))))
const percent = (value: number) => `${Number((value * 100).toFixed(2))}%`

/** Mirrors the tiered swap fee in production: lower on bigger trades and between stablecoins. */
const safeFeeRate = (usd: number, stable: boolean) => {
  const tiers = stable ? [0.001, 0.001, 0.0007, 0.0005] : [0.0035, 0.0035, 0.002, 0.001]
  if (usd < 50_000) return tiers[0]
  if (usd < 100_000) return tiers[1]
  if (usd < 1_000_000) return tiers[2]
  return tiers[3]
}

const Picker = ({
  label,
  value,
  options,
  onChange,
  chain,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  chain?: boolean
}) => (
  <Select
    items={options.map((option) => ({ value: option, label: option }))}
    value={value}
    onValueChange={(next) => next && onChange(String(next))}
  >
    <SelectTrigger aria-label={label} className="w-36 shrink-0">
      {chain && <ChainLogo chain={value} />}
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option} value={option}>
          {option}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const Leg = ({
  label,
  amount,
  picker,
  hint,
}: {
  label: string
  amount: ReactNode
  picker: ReactNode
  hint: ReactNode
}) => (
  <div className="flex flex-col gap-2 rounded-xl bg-muted px-4 py-3">
    <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">{amount}</div>
      {picker}
    </div>
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">{hint}</div>
  </div>
)

const Rows = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col overflow-hidden rounded-lg border border-border">
    {Children.toArray(children)
      .filter(Boolean)
      .map((row, index) => (
        <Fragment key={index}>
          {index > 0 && <Separator />}
          {row}
        </Fragment>
      ))}
  </div>
)

const Row = ({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) => (
  <div className="flex min-h-10 items-center justify-between gap-3 px-3 py-2 text-sm">
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {label}
      {hint && (
        <Tooltip delay={150}>
          <TooltipTrigger render={<span className="flex" />}>
            <Info className="size-3.5" aria-label={hint} />
          </TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      )}
    </span>
    <span className="text-right tabular-nums">{value}</span>
  </div>
)

const InlineSelect = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) => (
  <Select items={options} value={value} onValueChange={(next) => next && onChange(next as T)}>
    <SelectTrigger aria-label={label} size="sm" variant="ghost">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const Timeline = ({ items }: { items: { icon: LucideIcon; text: string; done?: boolean }[] }) => (
  <ol className="flex flex-col">
    {items.map(({ icon: Icon, text, done }, index) => (
      <li key={text} className="flex gap-3">
        <div className="flex flex-col items-center">
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full',
              done ? 'bg-success-tint text-badge-dot-success' : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </span>
          {index < items.length - 1 && <span aria-hidden className="w-px flex-1 bg-border" />}
        </div>
        <span className={cn('pt-0.5 pb-3 text-sm', !done && 'text-muted-foreground')}>{text}</span>
      </li>
    ))}
  </ol>
)

/** Swap or bridge idle cash in three steps: details, what signers approve, then proposed. */
export const MoveFundsDialog = ({
  open,
  mode,
  onModeChange,
  onInvest,
  balances,
  onClose,
}: {
  open: boolean
  mode: MoveMode
  onModeChange: (mode: MoveMode) => void
  onInvest: () => void
  balances: Slice[]
  onClose: () => void
}) => {
  const { safe } = useSafeInfo()
  const assets = balances.map((balance) => balance.label)
  const [step, setStep] = useState<Step>('details')
  const [from, setFrom] = useState(assets[0] ?? IDLE_CASH.asset)
  const [to, setTo] = useState(assets[1] ?? IDLE_CASH.asset)
  const [toChain, setToChain] = useState(CHAINS.find((chain) => chain !== IDLE_CASH.chain) ?? CHAINS[0])
  const [value, setValue] = useState('')
  const [slippage, setSlippage] = useState('auto')
  const [expiry, setExpiry] = useState<Expiry>('30m')
  const [route, setRoute] = useState<Route>('best')
  const [agreed, setAgreed] = useState(false)

  const isSwap = mode === 'swap'
  const Icon = ICONS[mode]
  const available = (balances.find((balance) => balance.label === from)?.value ?? 0) / priceOf(from)
  const amount = parseAmount(value)
  const usd = amount * priceOf(from)
  const receiveAsset = isSwap ? to : from
  const slip = slippage === 'auto' ? 0.005 : Number(slippage) / 100
  const feeRate = safeFeeRate(usd, STABLES.includes(from) && STABLES.includes(to))
  const quoted = isSwap ? (usd * (1 - feeRate)) / priceOf(to) : amount - ROUTE_FEES[route] / priceOf(from)
  const received = Math.max(quoted, 0)
  const minReceived = isSwap ? received * (1 - slip) : received
  const impact = usd >= 1_000_000 ? 0.0012 : usd >= 100_000 ? 0.0004 : 0.0001
  const deployed = DEPLOYED_ON.includes(toChain)
  const tooMuch = amount > available
  const canReview = amount > 0 && !tooMuch && agreed && (isSwap ? from !== to : deployed) && received > 0
  const needsApproval = from !== 'ETH'
  const sent = `${formatToken(amount)} ${from}`
  const got = `${formatToken(isSwap ? minReceived : received)} ${receiveAsset}`

  const close = () => {
    setStep('details')
    setValue('')
    onClose()
  }

  const recipient = isSwap ? (
    <Row label={COPY.recipient} value={COPY.thisSafe} />
  ) : (
    <Row
      label={COPY.recipient}
      value={
        <span className="flex flex-col items-end">
          {COPY.thisSafeOn(toChain)}
          {deployed && (
            <span className="flex items-center gap-1 text-xs text-badge-dot-success">
              <CheckCircle2 className="size-3" aria-hidden />
              {COPY.sameSetup}
            </span>
          )}
        </span>
      }
    />
  )

  const quoteRows = isSwap ? (
    <Rows>
      <Row label={COPY.minReceived} value={got} />
      <Row label={COPY.rate} value={COPY.rateValue(from, formatToken(priceOf(from) / priceOf(to)), to)} />
      <Row label={COPY.priceImpact} value={`< ${percent(impact)}`} />
      <Row
        label={COPY.slippage}
        value={
          <InlineSelect
            label={COPY.slippage}
            value={slippage}
            onChange={setSlippage}
            options={SLIPPAGES.map((option) => ({
              value: option,
              label: option === 'auto' ? COPY.slippageAuto('0.5%') : `${option}%`,
            }))}
          />
        }
      />
      <Row
        label={COPY.expiry}
        value={
          <InlineSelect
            label={COPY.expiry}
            value={expiry}
            onChange={setExpiry}
            options={(Object.keys(COPY.expiries) as Expiry[]).map((option) => ({
              value: option,
              label: COPY.expiries[option],
            }))}
          />
        }
      />
      <Row label={COPY.safeFee} hint={COPY.safeFeeHint} value={`${percent(feeRate)} · ${formatUsd(usd * feeRate)}`} />
      <Row label={COPY.networkFee} value={formatUsd(4)} />
      {recipient}
    </Rows>
  ) : (
    <Rows>
      {recipient}
      <Row label={COPY.bridgeFee} value={formatUsd(ROUTE_FEES[route])} />
      <Row label={COPY.networkFee} value={formatUsd(3)} />
      <Row label={COPY.arrives} value={COPY.routes[route].time} />
    </Rows>
  )

  const details = (
    <div className={cn(BODY_HEIGHT, 'flex flex-col gap-3 overflow-y-auto px-4 py-4')}>
      <Tabs value={mode} onValueChange={(next) => (next === 'invest' ? onInvest() : onModeChange(next as MoveMode))}>
        <TabsList className="w-full">
          <TabsTrigger value="invest">{DEFI_V1_COPY.operations.invest}</TabsTrigger>
          <TabsTrigger value="swap">{DEFI_V1_COPY.swap}</TabsTrigger>
          <TabsTrigger value="bridge">{DEFI_V1_COPY.bridge}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative flex flex-col gap-1">
        <Leg
          label={COPY.send}
          amount={
            <input
              aria-label={COPY.send}
              inputMode="decimal"
              placeholder="0"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={cn(
                'w-full bg-transparent text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50',
                tooMuch && 'text-destructive',
              )}
            />
          }
          picker={
            <Picker
              label={COPY.fromAsset}
              value={from}
              options={assets}
              onChange={(next) => {
                setFrom(next)
                if (next === to) setTo(assets.find((asset) => asset !== next) ?? next)
              }}
            />
          }
          hint={
            <>
              <span>{usd > 0 ? `≈ ${formatUsd(usd)}` : COPY.onChain(from, IDLE_CASH.chain)}</span>
              <button
                type="button"
                className="font-medium text-foreground hover:underline"
                onClick={() => setValue(String(Math.floor(available * 100) / 100))}
              >
                {COPY.available(formatToken(available), from, IDLE_CASH.chain)} · {COPY.max}
              </button>
            </>
          }
        />
        <span className="absolute top-1/2 left-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background ring-4 ring-background">
          <ArrowDown className="size-4 text-muted-foreground" aria-hidden />
        </span>
        <Leg
          label={COPY.receive}
          amount={
            <span className="block truncate text-2xl font-semibold tabular-nums">
              {amount > 0 ? formatToken(received) : '0'}
            </span>
          }
          picker={
            isSwap ? (
              <Picker
                label={COPY.toAsset}
                value={to}
                options={assets.filter((asset) => asset !== from)}
                onChange={setTo}
              />
            ) : (
              <Picker
                label={COPY.toNetwork}
                value={toChain}
                options={CHAINS.filter((chain) => chain !== IDLE_CASH.chain)}
                onChange={setToChain}
                chain
              />
            )
          }
          hint={
            <span>
              {COPY.onChain(receiveAsset, isSwap ? IDLE_CASH.chain : toChain)}
              {amount > 0 && ` · ≈ ${formatUsd(received * priceOf(receiveAsset))}`}
            </span>
          }
        />
      </div>

      {!isSwap && !deployed && (
        <p className="flex items-start gap-2 rounded-lg bg-warning-subtle px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning-strong" aria-hidden />
          {COPY.notDeployed(toChain)}
        </p>
      )}

      {!isSwap && (
        <RadioGroup
          aria-label={COPY.route}
          value={route}
          onValueChange={(next) => setRoute(next as Route)}
          className="grid grid-cols-2 gap-2"
        >
          {(Object.keys(COPY.routes) as Route[]).map((option) => (
            <FieldLabel key={option}>
              <Field orientation="horizontal">
                <RadioGroupItem value={option} />
                <FieldContent>
                  <FieldTitle>{COPY.routes[option].title}</FieldTitle>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {COPY.routes[option].time} · {formatUsd(ROUTE_FEES[option])}
                  </span>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      )}

      {amount > 0 && quoteRows}

      <label className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
        <Checkbox checked={agreed} onCheckedChange={(next) => setAgreed(Boolean(next))} />
        {COPY.terms}
      </label>
    </div>
  )

  const review = (
    <div className={cn(BODY_HEIGHT, 'flex flex-col gap-4 overflow-y-auto px-4 py-4')}>
      <div className="flex flex-col gap-1">
        <Typography variant="paragraph-small-medium" color="muted">
          {COPY.title[mode]}
        </Typography>
        <Typography variant="h3" className="tabular-nums">
          {COPY.summary(formatToken(amount), from, formatToken(received), receiveAsset)}
        </Typography>
      </div>
      {quoteRows}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{COPY.reviewTitle}</span>
        <div className="flex flex-col rounded-lg bg-card">
          <div className="px-3 pt-3">
            <Timeline
              items={[
                ...(needsApproval ? [{ icon: KeyRound, text: COPY.steps.approve(from), done: true }] : []),
                isSwap
                  ? { icon: Repeat2, text: COPY.steps.swap(sent, got), done: true }
                  : { icon: Orbit, text: COPY.steps.bridge(sent, toChain), done: true },
              ]}
            />
          </div>
          <div className="flex flex-col gap-2 border-t border-border/60 px-3 py-3 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <ShieldCheck className="size-3.5 shrink-0 translate-y-px text-badge-dot-success" aria-hidden />
              {COPY.checks}
            </p>
            <p className="flex items-start gap-2">
              <Info className="size-3.5 shrink-0 translate-y-px" aria-hidden />
              {isSwap ? COPY.afterSwap(COPY.expiries[expiry]) : COPY.afterBridge}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const proposed = (
    <div className={cn(BODY_HEIGHT, 'flex flex-col items-center gap-6 overflow-y-auto px-4 pt-8 pb-4')}>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-badge-dot-success/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-success-tint text-badge-dot-success">
            <Icon className="size-6" aria-hidden />
          </span>
        </span>
        <div className="flex flex-col items-center gap-1">
          <Typography variant="paragraph-small-medium" color="success">
            {COPY.proposed[mode]}
          </Typography>
          <Typography variant="h3" className="tabular-nums">
            {COPY.summary(formatToken(amount), from, formatToken(received), receiveAsset)}
          </Typography>
          <Typography variant="paragraph-small" color="muted">
            {isSwap ? IDLE_CASH.chain : `${IDLE_CASH.chain} → ${toChain}`}
          </Typography>
        </div>
      </div>
      <div className="w-full rounded-lg bg-card px-3 pt-3">
        <Timeline
          items={[
            { icon: Check, text: COPY.timeline.proposed, done: true },
            { icon: KeyRound, text: COPY.timeline.signatures(1, safe.threshold), done: safe.threshold <= 1 },
            { icon: Circle, text: COPY.timeline.execute },
            isSwap
              ? { icon: Coins, text: COPY.timeline.filled }
              : { icon: Orbit, text: COPY.timeline.arrives(toChain) },
          ]}
        />
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent size="sm" data-testid="move-funds-dialog">
        {step === 'proposed' ? (
          <DialogTitle className="sr-only">{COPY.proposed[mode]}</DialogTitle>
        ) : (
          <DialogHeader divided="subtle">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2">
                  <DialogTitle>{COPY.title[mode]}</DialogTitle>
                  {amount > 0 && step === 'review' && (
                    <Badge variant="brand" className="tabular-nums">
                      {sent}
                    </Badge>
                  )}
                </div>
                <DialogDescription>{COPY.lead[mode]}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        )}

        {{ details, review, proposed }[step]}

        <DialogFooter divided="subtle">
          {step === 'details' && (
            <Button size="lg" className="w-full" disabled={!canReview} onClick={() => setStep('review')}>
              {tooMuch ? COPY.notEnough(from) : COPY.review[mode]}
            </Button>
          )}
          {step === 'review' && (
            <div className="flex w-full gap-2">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('details')}>
                {COPY.back}
              </Button>
              <Button size="lg" className="flex-1" onClick={() => setStep('proposed')}>
                {COPY.submit[mode]}
              </Button>
            </div>
          )}
          {step === 'proposed' && (
            <div className="flex w-full gap-2">
              <Button variant="outline" size="lg" className="flex-1" onClick={close}>
                {DEFI_V1_COPY.operations.close}
              </Button>
              <Button size="lg" className="flex-1" onClick={close}>
                {COPY.track}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
