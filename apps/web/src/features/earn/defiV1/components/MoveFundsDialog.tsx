import { useState, type ReactNode } from 'react'
import { ArrowDown, Orbit, Repeat2 } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@safe-global/views/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatAmount, formatCompactUsd } from '../copy'
import { CHAIN_IDS, IDLE_CASH } from '../opportunities'
import type { Slice } from '../shelf'
import { ChainLogo } from './TreasuryTables'

export type MoveMode = 'swap' | 'bridge'

const COPY = DEFI_V1_COPY.move
const BODY_HEIGHT = 'h-[min(26rem,60vh)]'
// Mock prices for the prototype; real quotes come from the swap and bridge providers.
const PRICES: Record<string, number> = { USDC: 1, USDT: 1, ETH: 3_200 }
const CHAINS = Object.keys(CHAIN_IDS)
const ICONS = { swap: Repeat2, bridge: Orbit }

const parseAmount = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0
const priceOf = (asset: string) => PRICES[asset] ?? 1
const formatRate = (rate: number) => (rate >= 1 ? formatAmount(rate) : String(Number(rate.toPrecision(2))))

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
  hint: string
}) => (
  <div className="flex flex-col gap-2 rounded-xl bg-muted px-4 py-3">
    <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">{amount}</div>
      {picker}
    </div>
    <span className="text-xs text-muted-foreground tabular-nums">{hint}</span>
  </div>
)

const QuoteRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
)

/** Swap or bridge idle cash before investing, in the same shell as set up investment. */
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
  const [from, setFrom] = useState(assets[0] ?? IDLE_CASH.asset)
  const [to, setTo] = useState(assets[1] ?? IDLE_CASH.asset)
  const [toChain, setToChain] = useState(CHAINS.find((chain) => chain !== IDLE_CASH.chain) ?? CHAINS[0])
  const [value, setValue] = useState('')
  const [proposed, setProposed] = useState(false)

  const available = (balances.find((balance) => balance.label === from)?.value ?? 0) / priceOf(from)
  const amount = parseAmount(value)
  const receiveAsset = mode === 'swap' ? to : from
  const received = mode === 'swap' ? (amount * priceOf(from)) / priceOf(to) : amount
  const tooMuch = amount > available
  const Icon = ICONS[mode]

  const close = () => {
    setProposed(false)
    setValue('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent size="sm" data-testid="move-funds-dialog">
        {proposed ? (
          <DialogTitle className="sr-only">{COPY.proposed[mode]}</DialogTitle>
        ) : (
          <DialogHeader divided="subtle">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-col">
                <DialogTitle>{COPY.title[mode]}</DialogTitle>
                <DialogDescription>{COPY.lead[mode]}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        )}

        {proposed ? (
          <div className={cn(BODY_HEIGHT, 'flex flex-col items-center justify-center gap-4 px-4 text-center')}>
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
                {COPY.summary(formatAmount(amount), from, formatAmount(received), receiveAsset)}
              </Typography>
              <Typography variant="paragraph-small" color="muted">
                {mode === 'swap' ? IDLE_CASH.chain : `${IDLE_CASH.chain} → ${toChain}`} ·{' '}
                {DEFI_V1_COPY.operations.signatures(1, safe.threshold)}
              </Typography>
            </div>
          </div>
        ) : (
          <div className={cn(BODY_HEIGHT, 'flex flex-col gap-3 overflow-y-auto px-4 py-4')}>
            <Tabs
              value={mode}
              onValueChange={(next) => (next === 'invest' ? onInvest() : onModeChange(next as MoveMode))}
            >
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
                hint={COPY.available(formatAmount(available), from, IDLE_CASH.chain)}
              />
              <span className="absolute top-1/2 left-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background ring-4 ring-background">
                <ArrowDown className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <Leg
                label={COPY.receive}
                amount={
                  <span className="block truncate text-2xl font-semibold tabular-nums">
                    {amount > 0 ? formatAmount(received) : '0'}
                  </span>
                }
                picker={
                  mode === 'swap' ? (
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
                  mode === 'swap' ? COPY.onChain(receiveAsset, IDLE_CASH.chain) : COPY.onChain(receiveAsset, toChain)
                }
              />
            </div>

            <div className="flex flex-col gap-2 px-1 pt-1">
              {mode === 'swap' && (
                <QuoteRow label={COPY.rate} value={COPY.rateValue(from, formatRate(priceOf(from) / priceOf(to)), to)} />
              )}
              <QuoteRow label={COPY.fee} value={formatCompactUsd(mode === 'swap' ? 4 : 12)} />
              <QuoteRow label={COPY.arrives} value={COPY.time[mode]} />
              <QuoteRow label={COPY.approval} value={COPY.signers(safe.threshold, safe.owners.length)} />
            </div>
          </div>
        )}

        <DialogFooter divided="subtle">
          {proposed ? (
            <Button size="lg" className="w-full" onClick={close}>
              {DEFI_V1_COPY.operations.close}
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full"
              disabled={amount <= 0 || tooMuch || (mode === 'swap' && from === to)}
              onClick={() => setProposed(true)}
            >
              {tooMuch ? COPY.notEnough(from) : COPY.submit[mode]}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
