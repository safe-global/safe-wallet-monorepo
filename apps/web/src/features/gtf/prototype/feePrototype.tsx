import { useContext, useState, type ReactElement, type ReactNode } from 'react'
import classnames from 'classnames'
import { getAddress } from 'ethers'
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { TokenType } from '@safe-global/store/gateway/types'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FullAnalysisBuilder, RecipientAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Textarea } from '@safe-global/views/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { ProgressBar } from '@safe-global/views/components/common/ProgressBar'
import SplitMenuButton from '@safe-global/views/components/common/SplitMenuButton'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { EXECUTION_FEE_TOOLTIP, GAS_FEE_TOOLTIP } from '@safe-global/views/features/gtf/components/shared/tooltips'
import AssetsIcon from '@safe-global/views/assets/images/sidebar/assets.svg'
import TokenIcon from '@/components/common/TokenIcon'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxLayoutHeader } from '@/components/tx-flow/common/TxLayoutBase'
import layoutCss from '@/components/tx-flow/common/TxLayoutBase/styles.module.css'
import statusCss from '@/components/tx-flow/common/TxStatusWidget/styles.module.css'
import SponsoredTxsCounter from '@/components/tx/SponsoredTxsCounter'
// eslint-disable-next-line no-restricted-imports -- story-only prototype: SafeShieldWidget's hooks never settle in Storybook, so the display is fed mock analysis
import { SafeShieldDisplay } from '@/features/safe-shield/components/SafeShieldDisplay'
import ArrowOutwardIcon from '@/public/images/transactions/outgoing.svg'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'
import { Chip } from '@safe-global/views/components/ui/chip'
import CreatedIcon from '@/public/images/messages/created.svg'
import SignedIcon from '@/public/images/messages/signed.svg'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import FeeInfoBanner from '../components/FeeInfoBanner'
import feesCss from '../components/FeesPreview/styles.module.css'

export type FeePlan = 'free' | 'pro' | 'pro-none-left'
export type FeeSource = 'signer' | 'safe'

/** Who is signing: the first signer picks the fee, later signers see it, the last can sign and execute. */
export type SignerRole = 'first' | 'later' | 'last'

export const SPONSORED_QUOTA = 50
const RESETS_AT = '2026-11-11T00:00:00Z'
const NONCE = 1000

const ETH: Balance['tokenInfo'] = {
  address: '0x0000000000000000000000000000000000000000',
  decimals: 18,
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
  name: 'Ether',
  symbol: 'ETH',
  type: TokenType.NATIVE_TOKEN,
}

/** The gas fee in ETH. The execution fee comes later, so it reads Free everywhere for now. */
const GAS_FEE = 0.0004

const RECIPIENT = getAddress('0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe')

const SHIELD = FullAnalysisBuilder.knownRecipient(RECIPIENT)
  .recipient(RecipientAnalysisBuilder.knownRecipient(RECIPIENT).build())
  .threat(FullAnalysisBuilder.noThreat().build().threat)
  .build()

const MutedLine = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small" color="muted">
    {children}
  </Typography>
)

const SummaryLabel = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small-bold">{children}</Typography>
)

const BOX = 'rounded-lg border border-[var(--color-border-light)] px-4 py-3'

/** The confirm step's top as the Figma design draws it: Send and To, then Transaction details and Balance change. */
const TxSummary = (): ReactElement => (
  <div className="flex flex-col gap-4">
    <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-y-3">
      <SummaryLabel>Send</SummaryLabel>
      <div className="flex items-center gap-2">
        <TokenIcon logoUri={ETH.logoUri ?? undefined} tokenSymbol={ETH.symbol} size={32} />
        <Typography variant="paragraph">0.5466 ETH</Typography>
      </div>

      <SummaryLabel>To</SummaryLabel>
      <div className="text-sm leading-5">
        <NamedAddressInfo
          address={RECIPIENT}
          name="Example recipient"
          shortAddress={false}
          hasExplorer
          showCopyButton
          showPrefix={false}
          avatarSize={32}
          boldLabel
        />
      </div>
    </div>

    <div className="flex flex-col gap-2">
      <Collapsible>
        <div className={BOX}>
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between">
            <SummaryLabel>Transaction details</SummaryLabel>
            <span className="flex items-center gap-3">
              <SummaryLabel>transfer</SummaryLabel>
              <ChevronDown className="size-5 text-muted-foreground" />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <MutedLine>Native transfer of 0.5466 ETH to Example recipient.</MutedLine>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <div className={classnames(BOX, 'flex items-center gap-6')}>
        <span className="inline-flex shrink-0 items-center gap-2">
          <SummaryLabel>Balance change:</SummaryLabel>
          <InfoIcon className="size-4 text-foreground" />
        </span>
        <span className="flex flex-1 items-center gap-2">
          <ArrowOutwardIcon className="size-4" />
          <Typography variant="paragraph-small">-0.5466</Typography>
          <TokenIcon size={20} logoUri={ETH.logoUri ?? undefined} tokenSymbol={ETH.symbol} />
          <SummaryLabel>ETH</SummaryLabel>
        </span>
        <Chip size="auto" shape="tag">
          NATIVE
        </Chip>
      </div>
    </div>
  </div>
)

/** FeesPreview's PaymentSourceSelector, for any short list of options. */
const ChoiceSelector = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <div
          role="button"
          tabIndex={0}
          className={cn(feesCss.paymentSourceSelector, 'w-auto gap-2 whitespace-nowrap')}
          style={{ width: 'auto' }}
        />
      }
    >
      <Typography variant="paragraph-small-bold" className="tracking-[0.1px]">
        {options.find((option) => option.value === value)?.label}
      </Typography>
      <ChevronDown className={feesCss.selectorCaret} />
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start">
      {options.map((option) => (
        <DropdownMenuItem
          key={option.value}
          onClick={() => onChange(option.value)}
          className={feesCss.selectorMenuItem}
        >
          <Typography variant="paragraph-small-bold">{option.label}</Typography>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

/** The same pill with no menu: what a later signer or the executor sees once there is nothing to choose. */
const LockedSelector = ({
  children,
  tooltip,
  hasLeadingIcon = false,
}: {
  children: ReactNode
  tooltip: string
  /** A round icon first: inset it as far from the left edge as from the top, like the app's token pill. */
  hasLeadingIcon?: boolean
}): ReactElement => (
  <Tooltip>
    <TooltipTrigger
      render={
        <div
          className={cn(
            feesCss.paymentSourceSelector,
            feesCss.gasTokenSelectorLocked,
            'w-auto gap-2 whitespace-nowrap',
          )}
          style={{ width: 'auto', paddingLeft: hasLeadingIcon ? '3px' : undefined }}
        />
      }
    >
      {children}
      <Lock className="size-3.5 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent side="top">{tooltip}</TooltipContent>
  </Tooltip>
)

const LockedLabel = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small-bold" className="tracking-[0.1px]">
    {children}
  </Typography>
)

/** FeesPreview's GasTokenSelector, locked: the first release only pays fees in the chain's gas token. */
const FeeTokenSelector = (): ReactElement => (
  <LockedSelector tooltip="Fees are paid in ETH for now. More tokens are coming soon." hasLeadingIcon>
    <TokenIcon logoUri={ETH.logoUri ?? undefined} tokenSymbol={ETH.symbol} size={24} />
    <LockedLabel>{ETH.symbol}</LockedLabel>
  </LockedSelector>
)

const LabelledControl = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <div className={feesCss.paymentRowGroup}>
    <Typography variant="paragraph-small" color="muted">
      {label}
    </Typography>
    {children}
  </div>
)

const FeeLabel = ({ label, tooltip }: { label: string; tooltip: string }): ReactElement => (
  <Typography variant="paragraph-small" className="inline-flex items-center gap-2">
    {label}
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <InfoIcon className="size-4 text-[var(--color-border-main)]" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  </Typography>
)

const ProBadge = ({ className }: { className?: string }): ReactElement => (
  <span className={cn('block h-5 w-8 shrink-0', className)} role="img" aria-label="Safe Pro">
    <ProChip className="size-full" />
  </span>
)

/** SponsoredTxsCounter's upgrade strip, leading with what Pro gives. */
const ProUpsell = (): ReactElement => (
  <div className="flex items-center justify-between gap-3 px-4 py-3">
    <Typography variant="paragraph-small">Don&apos;t pay gas fees. Get sponsored transactions with Pro.</Typography>
    <Button variant="outline" size="xs" render={<a href="#upgrade" />}>
      Upgrade to
      <span className="block h-4 w-6" aria-label="Safe Pro">
        <ProChip className="size-full" />
      </span>
      <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
    </Button>
  </div>
)

const Counter = ({ left }: { left: number }): ReactElement => (
  <SponsoredTxsCounter left={left} quota={SPONSORED_QUOTA} resetsAt={RESETS_AT} isSubscription isPro={null} />
)

/** Who pays: the first signer picks Safe account or signer wallet; Pro sponsoring is offered on top of the signer wallet. */
type FeePayer = FeeSource | 'sponsored'

const PAYER_LABEL: Record<FeePayer, string> = {
  safe: 'Safe account',
  signer: 'Signer wallet',
  sponsored: 'Pro plan',
}

const LOCKED_TOOLTIP: Record<FeePayer, string> = {
  safe: "Set at signing and can't be changed.",
  signer: 'Whoever executes pays the gas fee.',
  sponsored: 'Covered by your sponsored transactions.',
}

/** Who pays at execution: Sponsored is only offered there, and only on Pro with sponsored transactions left. */
type ExecutionPayer = 'sponsored' | 'signer'

type FeeCard = {
  /** The "Pay fees from" control: a dropdown when there is a choice, a locked pill when there is not. */
  payerControl: ReactNode
  payer: FeePayer
}

/** Every fee state from the spec, on the existing FeesPreview card. */
const getFeeCard = ({
  screen,
  source,
  onSourceChange,
  payer,
  onPayerChange,
}: {
  screen: ScreenProps
  source: FeeSource
  onSourceChange: (source: FeeSource) => void
  payer: ExecutionPayer
  onPayerChange: (payer: ExecutionPayer) => void
}): FeeCard => {
  const { plan, step, role = 'first', lockedSource = 'safe', sponsoredLeftAtExecution = SPONSORED_QUOTA - 1 } = screen
  const sponsoredAtSigning = plan === 'pro'

  const locked = (lockedPayer: FeePayer): FeeCard => ({
    payerControl: (
      <LockedSelector tooltip={LOCKED_TOOLTIP[lockedPayer]}>
        <LockedLabel>{PAYER_LABEL[lockedPayer]}</LockedLabel>
      </LockedSelector>
    ),
    payer: lockedPayer,
  })

  if (step === 'sign') {
    if (sponsoredAtSigning) return locked('sponsored')
    if (role !== 'first') return locked(lockedSource)

    const sourceOptions = (['safe', 'signer'] as const).map((value) => ({ value, label: PAYER_LABEL[value] }))
    return {
      payerControl: <ChoiceSelector value={source} options={sourceOptions} onChange={onSourceChange} />,
      payer: source,
    }
  }

  if (lockedSource === 'safe' && !sponsoredAtSigning) return locked('safe')

  if (plan === 'pro' && sponsoredLeftAtExecution > 0) {
    const payerOptions = (['sponsored', 'signer'] as const).map((value) => ({ value, label: PAYER_LABEL[value] }))
    return {
      payerControl: <ChoiceSelector value={payer} options={payerOptions} onChange={onPayerChange} />,
      payer,
    }
  }

  return locked('signer')
}

const SEND_ETH = 0.5466
const ETH_FIAT = 3650

const formatEth = (amount: number): string => `${Number(amount.toFixed(5))} ETH`
const formatFiat = (amount: number): string =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** The existing FeesPreview card: who pays and in what token, Execution fee and Gas fee, then Total outgoing. */
const FeeSection = ({ card, screen }: { card: FeeCard; screen: ScreenProps }): ReactElement => {
  const { plan, step, sponsoredLeftAtExecution = SPONSORED_QUOTA - 1 } = screen
  const isSponsored = card.payer === 'sponsored'
  // Gas counts whoever pays it; only a sponsored transaction leaves it out.
  const total = SEND_ETH + (isSponsored ? 0 : GAS_FEE)
  const left = plan === 'pro-none-left' ? 0 : step === 'sign' ? SPONSORED_QUOTA - 1 : sponsoredLeftAtExecution

  return (
    <div className={feesCss.container}>
      <div className={feesCss.header}>
        <Typography variant="paragraph-small-bold">Fees</Typography>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border-light)]">
        {/* Spacing rule: 16px sides everywhere, 56px top and bottom bands (32px control + 12px), 8px inside the middle. */}
        <div className={cn(feesCss.paymentRow, 'min-h-14 px-4 py-3')}>
          <LabelledControl label="Pay fees from:">{card.payerControl}</LabelledControl>
          <LabelledControl label="Fees token:">
            <FeeTokenSelector />
          </LabelledControl>
        </div>

        <Separator />

        <div className="flex flex-col gap-2 p-2 px-4">
          <div className="flex min-h-10 items-center justify-between">
            <FeeLabel label="Execution fee" tooltip={EXECUTION_FEE_TOOLTIP} />
            <Typography variant="paragraph-small" color="muted">
              Free
            </Typography>
          </div>

          <div className="flex min-h-10 items-center justify-between">
            <FeeLabel label="Gas fee" tooltip={GAS_FEE_TOOLTIP} />
            {isSponsored ? (
              <span className="flex items-center gap-2">
                <Typography variant="paragraph-small" color="muted" className="line-through">
                  {formatEth(GAS_FEE)}
                </Typography>
                <ProBadge />
              </span>
            ) : (
              <span className="flex flex-col items-end">
                <Typography variant="paragraph-small">{formatEth(GAS_FEE)}</Typography>
                <Typography variant="paragraph-mini" color="muted">
                  {formatFiat(GAS_FEE * ETH_FIAT)}
                </Typography>
              </span>
            )}
          </div>
          <div className={cn(feesCss.totalOutgoing, '-mx-2')} style={{ padding: '8px' }}>
            <Typography variant="paragraph-small-bold">Total outgoing</Typography>
            <div className={feesCss.totalOutgoingValue}>
              <Typography variant="paragraph-small-bold">{formatEth(total)}</Typography>
              <Typography variant="paragraph-mini" color="muted">
                {formatFiat(total * ETH_FIAT)}
              </Typography>
            </div>
          </div>
        </div>

        <div className="flex min-h-14 items-center border-t border-[var(--color-border-light)] [&>*]:w-full [&_[data-testid=sponsored-txs-counter]]:bg-transparent">
          {plan === 'free' ? <ProUpsell /> : <Counter left={left} />}
        </div>
      </div>
    </div>
  )
}

/** TxStatusWidget's rail with fixed steps: the real one reads the wallet and a queued transaction. */
const StepRail = ({ confirmations, threshold }: { confirmations: number; threshold: number }): ReactElement => {
  const steps: { label: string; done: boolean; icon: ReactNode }[] = [
    { label: 'Create', done: true, icon: <CreatedIcon /> },
    { label: 'Review', done: true, icon: <SignedIcon /> },
    { label: `Confirm (${confirmations} of ${threshold})`, done: confirmations >= threshold, icon: <SignedIcon /> },
    { label: 'Execute', done: false, icon: <SignedIcon /> },
  ]

  return (
    <ul className={statusCss.status}>
      {steps.map(({ label, done, icon }) => (
        <li key={label} className={classnames(statusCss.item, { [statusCss.incomplete]: !done })}>
          <span className={statusCss.itemIcon}>{icon}</span>
          <span className="sr-only min-[1200px]:not-sr-only min-[1200px]:truncate text-xs leading-4 font-normal">
            {label}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** What a click on the screen's main button means for the flow: the next screen, or the end of it. */
type FlowAction = 'next' | 'finish'

const PrimaryAction = ({
  screen,
  source,
  onAction,
}: {
  screen: ScreenProps
  source: FeeSource
  onAction: (action: FlowAction) => void
}): ReactElement => {
  const { step, role = 'first', lockedSource = 'safe', plan } = screen

  if (step === 'execute') {
    return (
      <Button size="submit" onClick={() => onAction('finish')}>
        Execute
      </Button>
    )
  }
  if (role === 'first') {
    return (
      <Button size="submit" onClick={() => onAction('next')}>
        Continue
      </Button>
    )
  }

  // One click only works when the Safe pays: the relayer can then execute right after the last signature.
  if (role === 'last' && lockedSource === 'safe' && plan !== 'pro' && source === 'safe') {
    return (
      <div className="w-56">
        <SplitMenuButton
          options={[
            { id: 'sign-execute', label: 'Sign and execute' },
            { id: 'sign', label: 'Sign' },
          ]}
          onClick={(option) => onAction(option.id === 'sign-execute' ? 'finish' : 'next')}
        />
      </div>
    )
  }

  return (
    <Button size="submit" onClick={() => onAction('next')}>
      Sign
    </Button>
  )
}

export type ScreenProps = {
  /** The plan when the first signer signs: Free, Pro with sponsored transactions left, or Pro with none left. */
  plan: FeePlan
  step: 'sign' | 'execute'
  /** On the sign step: the first signer picks the fee, later signers see it, the last one can sign and execute. */
  role?: SignerRole
  /** What the first signer picked. */
  lockedSource?: FeeSource
  initialSource?: FeeSource
  /** Pro only: sponsored transactions left when the executor opens it. */
  sponsoredLeftAtExecution?: number
  threshold?: number
}

const TITLE: Record<ScreenProps['step'], string> = {
  sign: 'Confirm transaction',
  execute: 'Execute transaction',
}

const CONFIRMATIONS_BEFORE: Record<SignerRole, (threshold: number) => number> = {
  first: () => 0,
  later: (threshold) => Math.max(1, threshold - 2),
  last: (threshold) => threshold - 1,
}

/** The app's tx layout (TxLayoutBase markup) around a "Send tokens" transaction with the new fee card. */
export const FeeScreen = ({
  screenId,
  onAction = () => {},
  onBack,
  onSourceChange,
  ...screen
}: ScreenProps & {
  /** A new id resets the fee choices in place, so the layout around them never remounts. */
  screenId?: string
  onAction?: (action: FlowAction) => void
  onBack?: () => void
  /** The first signer switched who pays, which moves the prototype to that payer's flow. */
  onSourceChange?: (source: FeeSource) => void
}): ReactElement => {
  const { step, role = 'first', initialSource = 'signer', threshold = 3 } = screen
  const [source, setSource] = useState<FeeSource>(initialSource)
  const [payer, setPayer] = useState<ExecutionPayer>('sponsored')
  const [shownScreenId, setShownScreenId] = useState(screenId)

  if (screenId !== shownScreenId) {
    setShownScreenId(screenId)
    setSource(initialSource)
    setPayer('sponsored')
  }
  const defaults = useContext(SafeTxContext)

  const changeSource = (next: FeeSource) => {
    setSource(next)
    onSourceChange?.(next)
  }

  const card = getFeeCard({ screen, source, onSourceChange: changeSource, payer, onPayerChange: setPayer })
  const confirmations = step === 'sign' ? CONFIRMATIONS_BEFORE[role](threshold) : threshold
  const isFirstSigner = step === 'sign' && role === 'first'

  return (
    <SafeTxContext.Provider value={{ ...defaults, nonce: NONCE, recommendedNonce: NONCE, nonceNeeded: true }}>
      <div className="min-h-screen bg-[var(--color-background-main)] p-6 pb-24 [[data-theme=dark]_&]:bg-background">
        <div className={classnames('flex flex-wrap', layoutCss.container)}>
          <div className="w-14 pt-10 min-[1200px]:w-[200px]">
            <aside>
              <StepRail confirmations={confirmations} threshold={threshold} />
            </aside>
          </div>

          <div className="w-full min-w-0 flex-grow min-[900px]:flex-1 min-[900px]:pl-4 min-[1200px]:pl-10">
            <div className={classnames('mx-auto w-full max-w-[1200px]', layoutCss.contentContainer)}>
              <div className="flex flex-wrap justify-center gap-6 min-[900px]:flex-nowrap">
                <div className="min-w-0 flex-grow min-[900px]:max-w-[672px]">
                  <div className={layoutCss.titleWrapper}>
                    <Typography variant="h3" className={classnames('font-bold', layoutCss.title)}>
                      {TITLE[step]}
                    </Typography>
                  </div>

                  <div className={classnames('overflow-hidden rounded-t-xl bg-card', layoutCss.header)}>
                    <ProgressBar value={step === 'execute' ? 90 : 75} color="secondary" />
                    <TxLayoutHeader subtitle="Send tokens" icon={AssetsIcon} fixedNonce />
                  </div>

                  <div className={layoutCss.step}>
                    <TxCard>
                      <TxSummary />

                      <FeeSection card={card} screen={screen} />

                      {isFirstSigner && (
                        <div className="flex flex-col gap-2">
                          <Typography variant="paragraph-small-bold">Note</Typography>
                          <Textarea placeholder="Optional" rows={2} />
                          <Typography variant="paragraph-mini" color="muted">
                            Notes are publicly visible. Do not share any private or sensitive details.
                          </Typography>
                        </div>
                      )}

                      {isFirstSigner && <Separator />}

                      <TxCardActions>
                        <PrimaryAction
                          screen={screen}
                          source={isFirstSigner ? source : (screen.lockedSource ?? 'safe')}
                          onAction={onAction}
                        />
                      </TxCardActions>
                    </TxCard>

                    {(isFirstSigner || step === 'execute') && (
                      <Button variant="outline" className={layoutCss.backButton} onClick={onBack}>
                        {isFirstSigner ? 'Back' : 'Execute later'}
                      </Button>
                    )}
                  </div>
                </div>

                <div
                  className={classnames(
                    'w-full min-[900px]:w-[37.5%] min-[900px]:shrink-0 lg:w-[320px]',
                    layoutCss.widget,
                  )}
                >
                  <div className={layoutCss.sticky}>
                    <SafeShieldDisplay {...SHIELD} showHypernativeInfo={false} hasProFeatures isSafePro />
                    <div className={layoutCss.sidebarSlot}>
                      <FeeInfoBanner />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SafeTxContext.Provider>
  )
}

type FlowStep = { label: string; props: ScreenProps }
export type Flow = { id: string; label: string; source?: FeeSource; steps: FlowStep[] }

/** First, second and last signer, then the executor, for a fee the first signer locks in (or not). */
const signThenExecute = (plan: FeePlan, source: FeeSource | undefined, execute: Partial<ScreenProps> = {}) => {
  const lockedSource = source ?? 'signer'
  return [
    { label: 'First signer', props: { plan, step: 'sign', role: 'first', initialSource: source } },
    { label: 'Second signer', props: { plan, step: 'sign', role: 'later', lockedSource } },
    { label: 'Last signer', props: { plan, step: 'sign', role: 'last', lockedSource, initialSource: source } },
    { label: 'Executor', props: { plan, step: 'execute', lockedSource, ...execute } },
  ] satisfies FlowStep[]
}

/** Every flow, grouped by the plan the first signer signs on. */
export const CASES: { id: FeePlan; label: string; flows: Flow[] }[] = [
  {
    id: 'free',
    label: 'Free plan',
    flows: [
      { id: 'free-safe', label: 'Pay from Safe account', source: 'safe', steps: signThenExecute('free', 'safe') },
      {
        id: 'free-signer',
        label: 'Pay from signer wallet',
        source: 'signer',
        steps: signThenExecute('free', 'signer'),
      },
    ],
  },
  {
    id: 'pro',
    label: 'Pro, sponsored left',
    flows: [
      { id: 'pro-sponsored', label: 'Sponsored by Pro', steps: signThenExecute('pro', undefined) },
      {
        id: 'pro-ran-out',
        label: 'Sponsoring ran out before execution',
        steps: signThenExecute('pro', undefined, { sponsoredLeftAtExecution: 0 }),
      },
    ],
  },
  {
    id: 'pro-none-left',
    label: 'Pro, none left',
    flows: [
      {
        id: 'pnl-safe',
        label: 'Pay from Safe account',
        source: 'safe',
        steps: signThenExecute('pro-none-left', 'safe'),
      },
      {
        id: 'pnl-signer',
        label: 'Pay from signer wallet',
        source: 'signer',
        steps: signThenExecute('pro-none-left', 'signer'),
      },
    ],
  },
]

const ALL_FLOWS = CASES.flatMap(({ flows }) => flows)

export const getFlow = (id: string): Flow => ALL_FLOWS.find((flow) => flow.id === id) ?? ALL_FLOWS[0]

/** Clickable flows: each screen's buttons move to the next signer, and a floating bar steps and jumps between flows. */
export const FeePrototype = ({ flowId }: { flowId: string }): ReactElement => {
  const [flow, setFlow] = useState(() => getFlow(flowId))
  const [stepIndex, setStepIndex] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const currentCase = CASES.find(({ flows }) => flows.some(({ id }) => id === flow.id))
  const step = flow.steps[stepIndex]
  const isLast = stepIndex === flow.steps.length - 1

  const goTo = (next: Flow, index = 0) => {
    setFlow(next)
    setStepIndex(index)
    setIsDone(false)
  }

  const onAction = (action: FlowAction) => {
    if (action === 'finish' || isLast) setIsDone(true)
    else goTo(flow, stepIndex + 1)
  }

  // Switching who pays on the first screen moves to that payer's flow in the same case.
  const onSourceChange = (source: FeeSource) => {
    const sibling = currentCase?.flows.find((candidate) => candidate.source === source)
    if (sibling && sibling.id !== flow.id) goTo(sibling)
  }

  return (
    <>
      <FeeScreen
        screenId={`${flow.id}-${stepIndex}`}
        {...step.props}
        onAction={onAction}
        onBack={() => stepIndex > 0 && goTo(flow, stepIndex - 1)}
        onSourceChange={onSourceChange}
      />

      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card p-1 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous screen"
          disabled={stepIndex === 0}
          onClick={() => goTo(flow, stepIndex - 1)}
        >
          <ChevronLeft />
        </Button>
        <Typography variant="paragraph-small" className="min-w-40 text-center whitespace-nowrap">
          {isDone ? 'Done' : `${stepIndex + 1} of ${flow.steps.length} · ${step.label}`}
        </Typography>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next screen"
          disabled={isLast}
          onClick={() => goTo(flow, stepIndex + 1)}
        >
          <ChevronRight />
        </Button>
        {isDone && (
          <Button variant="ghost" size="sm" onClick={() => goTo(flow)}>
            Restart
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            {currentCase?.label} · {flow.label}
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className="max-h-[70vh] overflow-y-auto">
            {CASES.map((feeCase, index) => (
              <DropdownMenuGroup key={feeCase.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{feeCase.label}</DropdownMenuLabel>
                {feeCase.flows.map((candidate) => (
                  <DropdownMenuItem key={candidate.id} onClick={() => goTo(candidate)}>
                    {candidate.id === flow.id && <Check className="size-4" />}
                    {candidate.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
