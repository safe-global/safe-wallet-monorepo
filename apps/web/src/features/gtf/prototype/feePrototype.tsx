import { useContext, useState, type ReactElement, type ReactNode } from 'react'
import classnames from 'classnames'
import { getAddress } from 'ethers'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
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
import { GAS_FEE_TOOLTIP } from '@safe-global/views/features/gtf/components/shared/tooltips'
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
import { AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import CreatedIcon from '@/public/images/messages/created.svg'
import SignedIcon from '@/public/images/messages/signed.svg'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
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

/** The network fee in ETH; the Free plan's relaying adds a 5% premium. */
const FEE = { amount: '0.0004', withPremium: '0.00042', fiat: '$1.46', fiatWithPremium: '$1.53' }

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
          className={cn(feesCss.paymentSourceSelector, 'gap-2 whitespace-nowrap')}
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

const FeeToken = (): ReactElement => (
  <span className="inline-flex items-center gap-1">
    <TokenIcon logoUri={ETH.logoUri ?? undefined} tokenSymbol={ETH.symbol} size={24} />
    <Typography variant="paragraph-small">{ETH.symbol}</Typography>
  </span>
)

const Regular = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small">{children}</Typography>
)

/** "Fees will be paid from <payer> using ETH": the one sentence every paying state uses. */
const PaidFromSentence = ({ payer }: { payer: ReactNode }): ReactElement => (
  <>
    <Regular>Fees will be paid from</Regular>
    {payer}
    <Regular>using</Regular>
    <FeeToken />
  </>
)

const FreeChip = (): ReactElement => (
  <span className="inline-flex h-5 items-center rounded-[5px] bg-[var(--mint)] px-1.5 text-[10px] leading-none font-bold text-[var(--color-static-main)]">
    FREE
  </span>
)

/** SponsoredTxsCounter's upgrade strip, for the Free plan's executor. */
const ProUpsell = (): ReactElement => (
  <div className="flex items-center justify-between gap-3 bg-muted px-4 py-2">
    <Typography variant="paragraph-small">Sponsored transactions are included in Pro.</Typography>
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
  <SponsoredTxsCounter left={left} quota={SPONSORED_QUOTA} resetsAt={RESETS_AT} isSubscription isPro />
)

/** Who pays at execution: Sponsored is only offered there, and only on Pro with sponsored transactions left. */
type ExecutionPayer = 'sponsored' | 'signer'

type FeeCard = {
  sentence?: ReactNode
  /** FREE instead of an amount. */
  isFree?: boolean
  hasPremium?: boolean
  note?: string
  footer?: ReactNode
}

const SIGNER_NOTE = 'Estimate. Paid at execution.'
const SIGNER_NOTE_PRO = 'Estimate. Paid at execution, unless sponsored transactions have reset by then.'
const SPONSORED_NOTE =
  'Sponsored by your Pro plan. If none are left at execution, the signer wallet that executes pays.'

/** Every fee state from the spec, in one place so the copy stays parallel across them. */
const buildFeeCard = ({
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

  const lockedSafe: FeeCard = {
    sentence: (
      <PaidFromSentence
        payer={
          <Regular>
            this <span className="font-semibold">Safe account</span>
          </Regular>
        }
      />
    ),
    hasPremium: plan === 'free',
    note: "Set at signing and can't be changed.",
  }

  if (step === 'sign' && role === 'first') {
    if (sponsoredAtSigning) {
      return {
        isFree: true,
        note: SPONSORED_NOTE,
        footer: <Counter left={SPONSORED_QUOTA - 1} />,
      }
    }

    const sourceOptions = [
      { value: 'safe' as const, label: 'Safe account' },
      { value: 'signer' as const, label: 'Signer wallet' },
    ]

    return {
      sentence: (
        <PaidFromSentence payer={<ChoiceSelector value={source} options={sourceOptions} onChange={onSourceChange} />} />
      ),
      hasPremium: plan === 'free' && source === 'safe',
      note:
        source === 'safe' ? "Once you sign, this can't be changed." : plan === 'free' ? SIGNER_NOTE : SIGNER_NOTE_PRO,
      footer: plan === 'pro-none-left' ? <Counter left={0} /> : undefined,
    }
  }

  if (step === 'sign') {
    if (sponsoredAtSigning) {
      return {
        isFree: true,
        note: SPONSORED_NOTE,
        footer: <Counter left={SPONSORED_QUOTA - 1} />,
      }
    }
    if (lockedSource === 'safe') return lockedSafe

    return {
      sentence: (
        <PaidFromSentence
          payer={
            <Regular>
              the <span className="font-semibold">signer wallet</span> that executes
            </Regular>
          }
        />
      ),
      note: plan === 'free' ? SIGNER_NOTE : SIGNER_NOTE_PRO,
      footer: plan === 'pro-none-left' ? <Counter left={0} /> : undefined,
    }
  }

  if (lockedSource === 'safe' && !sponsoredAtSigning) return lockedSafe

  if (plan === 'pro' && sponsoredLeftAtExecution > 0) {
    const payerOptions = [
      { value: 'sponsored' as const, label: 'Sponsored' },
      { value: 'signer' as const, label: 'Signer wallet' },
    ]
    const selector = <ChoiceSelector value={payer} options={payerOptions} onChange={onPayerChange} />

    return payer === 'sponsored'
      ? {
          sentence: (
            <>
              <Regular>Fees will be</Regular>
              {selector}
              <Regular>by your Pro plan</Regular>
            </>
          ),
          isFree: true,
          note: `Uses 1 of your ${sponsoredLeftAtExecution} sponsored transactions left.`,
          footer: <Counter left={sponsoredLeftAtExecution} />,
        }
      : {
          sentence: <PaidFromSentence payer={selector} />,
          note: 'Paid from your signer wallet when you execute.',
          footer: <Counter left={sponsoredLeftAtExecution} />,
        }
  }

  const yourWallet = (
    <PaidFromSentence
      payer={
        <Regular>
          your <span className="font-semibold">signer wallet</span>
        </Regular>
      }
    />
  )

  if (plan === 'pro') {
    return {
      sentence: yourWallet,
      note: `Sponsoring is no longer available: all ${SPONSORED_QUOTA} sponsored transactions this month are used.`,
      footer: <Counter left={0} />,
    }
  }

  if (plan === 'pro-none-left') {
    return {
      sentence: yourWallet,
      note: 'No sponsored transactions left.',
      footer: <Counter left={0} />,
    }
  }

  return {
    sentence: yourWallet,
    note: 'Paid from your signer wallet when you execute.',
    footer: <ProUpsell />,
  }
}

/** The plan's strip at the bottom of every fee card: the upsell on Free, the sponsored counter on Pro. */
const getFeeCard = (options: Parameters<typeof buildFeeCard>[0]): FeeCard => {
  const card = buildFeeCard(options)
  if (card.footer) return card

  const { plan, step, sponsoredLeftAtExecution = SPONSORED_QUOTA - 1 } = options.screen
  if (plan === 'free') return { ...card, footer: <ProUpsell /> }

  const left = plan === 'pro-none-left' ? 0 : step === 'sign' ? SPONSORED_QUOTA - 1 : sponsoredLeftAtExecution
  return { ...card, footer: <Counter left={left} /> }
}

/** FeesPreview's elements regrouped: who pays in one sentence, one "Network fee" total, a note, then any counter. */
const FeeSection = ({ card }: { card: FeeCard }): ReactElement => (
  <div className={feesCss.container}>
    <Typography variant="paragraph-small-bold">Fees</Typography>
    <div className="overflow-hidden rounded-lg border border-[var(--color-border-light)]">
      <div className="flex flex-col gap-4 p-4">
        {card.sentence && <div className="flex min-h-8 flex-wrap items-center gap-2">{card.sentence}</div>}

        <div className="flex flex-col gap-2">
          <div className={feesCss.totalOutgoing} style={{ padding: '12px 16px' }}>
            <Typography variant="paragraph-small-bold" className="inline-flex items-center gap-1">
              Network fee
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex" />}>
                  <InfoIcon className="size-4 text-[var(--color-border-main)]" />
                </TooltipTrigger>
                <TooltipContent>{GAS_FEE_TOOLTIP}</TooltipContent>
              </Tooltip>
            </Typography>
            <div className={cn(feesCss.totalOutgoingValue, 'min-h-9 justify-center')}>
              {card.isFree ? (
                <span className="flex items-center gap-2">
                  <FreeChip />
                  <Typography variant="paragraph-small" color="muted" className="line-through">
                    {FEE.amount} ETH
                  </Typography>
                </span>
              ) : (
                <>
                  <Typography variant="paragraph-small-bold">
                    {card.hasPremium ? FEE.withPremium : FEE.amount} ETH
                  </Typography>
                  <span className="inline-flex items-center gap-1">
                    <Typography variant="paragraph-mini" color="muted">
                      {card.hasPremium ? FEE.fiatWithPremium : FEE.fiat}
                    </Typography>
                    {card.hasPremium && (
                      <Tooltip>
                        <TooltipTrigger render={<span className="inline-flex" aria-label="About this fee" />}>
                          <InfoIcon className="size-3.5 text-[var(--color-border-main)]" />
                        </TooltipTrigger>
                        <TooltipContent>Includes a 5% premium.</TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
          {card.note && (
            <Typography variant="paragraph-mini" color="muted">
              {card.note}
            </Typography>
          )}
        </div>
      </div>

      {card.footer}
    </div>
  </div>
)

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

const PrimaryAction = ({ screen, source }: { screen: ScreenProps; source: FeeSource }): ReactElement => {
  const { step, role = 'first', lockedSource = 'safe', plan } = screen

  if (step === 'execute') return <Button size="submit">Execute</Button>
  if (role === 'first') return <Button size="submit">Continue</Button>

  // One click only works when the Safe pays: the relayer can then execute right after the last signature.
  if (role === 'last' && lockedSource === 'safe' && plan !== 'pro' && source === 'safe') {
    return (
      <div className="w-56">
        <SplitMenuButton
          options={[
            { id: 'sign-execute', label: 'Sign and execute' },
            { id: 'sign', label: 'Sign' },
          ]}
        />
      </div>
    )
  }

  return <Button size="submit">Sign</Button>
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

/** The app's tx layout (TxLayoutBase markup) around a "Send tokens" transaction with the new fee card. */
export const FeeScreen = ({
  screenId,
  ...screen
}: ScreenProps & {
  /** A new id resets the fee choices in place, so the layout around them never remounts. */
  screenId?: string
}): ReactElement => {
  const { step, role = 'first', initialSource = 'signer', threshold = 2 } = screen
  const [source, setSource] = useState<FeeSource>(initialSource)
  const [payer, setPayer] = useState<ExecutionPayer>('sponsored')
  const [shownScreenId, setShownScreenId] = useState(screenId)

  if (screenId !== shownScreenId) {
    setShownScreenId(screenId)
    setSource(initialSource)
    setPayer('sponsored')
  }
  const defaults = useContext(SafeTxContext)

  const card = getFeeCard({ screen, source, onSourceChange: setSource, payer, onPayerChange: setPayer })
  const confirmations = step === 'sign' ? (role === 'first' ? 0 : threshold - 1) : threshold
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

                      <FeeSection card={card} />

                      {isFirstSigner && (
                        <div className="flex flex-col gap-2">
                          <Typography variant="paragraph-small-bold">Note</Typography>
                          <Textarea placeholder="Optional" rows={2} />
                          <Typography variant="paragraph-mini" color="muted">
                            Notes are publicly visible. Do not share any private or sensitive details.
                          </Typography>
                        </div>
                      )}

                      {(isFirstSigner || step === 'execute') && <Separator />}

                      {step === 'execute' && (
                        <Typography variant="paragraph-small" color="muted" role="note" className="flex gap-3">
                          <AlertSeverityIcon
                            variant="info"
                            aria-hidden="true"
                            className="size-4 shrink-0 translate-y-0.5"
                          />
                          Any signer can execute this transaction.
                        </Typography>
                      )}

                      <TxCardActions>
                        <PrimaryAction
                          screen={screen}
                          source={isFirstSigner ? source : (screen.lockedSource ?? 'safe')}
                        />
                      </TxCardActions>
                    </TxCard>

                    {(isFirstSigner || step === 'execute') && (
                      <Button variant="outline" className={layoutCss.backButton}>
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

export type Screen = { id: string; label: string; props: ScreenProps }

/** Every screen, grouped by the plan the first signer signs on. */
export const CASES: { id: FeePlan; label: string; screens: Screen[] }[] = [
  {
    id: 'free',
    label: 'Free plan',
    screens: [
      { id: 'free-sign-first', label: 'Sign · First signer', props: { plan: 'free', step: 'sign', role: 'first' } },
      {
        id: 'free-sign-later-safe',
        label: 'Sign · Later signer, Safe account locked',
        props: { plan: 'free', step: 'sign', role: 'later', lockedSource: 'safe', threshold: 3 },
      },
      {
        id: 'free-sign-later-signer',
        label: 'Sign · Later signer, signer wallet picked',
        props: { plan: 'free', step: 'sign', role: 'later', lockedSource: 'signer', threshold: 3 },
      },
      {
        id: 'free-sign-last-safe',
        label: 'Sign · Last signer, sign and execute',
        props: { plan: 'free', step: 'sign', role: 'last', lockedSource: 'safe', initialSource: 'safe' },
      },
      {
        id: 'free-exec-safe',
        label: 'Execute · Safe account locked',
        props: { plan: 'free', step: 'execute', lockedSource: 'safe' },
      },
      {
        id: 'free-exec-signer',
        label: 'Execute · Signer wallet only',
        props: { plan: 'free', step: 'execute', lockedSource: 'signer' },
      },
    ],
  },
  {
    id: 'pro',
    label: 'Pro, sponsored left',
    screens: [
      { id: 'pro-sign-first', label: 'Sign · First signer', props: { plan: 'pro', step: 'sign', role: 'first' } },
      {
        id: 'pro-sign-later',
        label: 'Sign · Later signer',
        props: { plan: 'pro', step: 'sign', role: 'later', threshold: 3 },
      },
      {
        id: 'pro-exec-choose',
        label: 'Execute · Sponsored or signer wallet',
        props: { plan: 'pro', step: 'execute', lockedSource: 'signer' },
      },
      {
        id: 'pro-exec-ran-out',
        label: 'Execute · Sponsoring ran out',
        props: { plan: 'pro', step: 'execute', lockedSource: 'signer', sponsoredLeftAtExecution: 0 },
      },
    ],
  },
  {
    id: 'pro-none-left',
    label: 'Pro, none left',
    screens: [
      {
        id: 'pnl-sign-first',
        label: 'Sign · First signer',
        props: { plan: 'pro-none-left', step: 'sign', role: 'first', initialSource: 'safe' },
      },
      {
        id: 'pnl-sign-later-safe',
        label: 'Sign · Later signer, Safe account locked',
        props: { plan: 'pro-none-left', step: 'sign', role: 'later', lockedSource: 'safe', threshold: 3 },
      },
      {
        id: 'pnl-sign-later-signer',
        label: 'Sign · Later signer, signer wallet picked',
        props: { plan: 'pro-none-left', step: 'sign', role: 'later', lockedSource: 'signer', threshold: 3 },
      },
      {
        id: 'pnl-sign-last-safe',
        label: 'Sign · Last signer, sign and execute',
        props: { plan: 'pro-none-left', step: 'sign', role: 'last', lockedSource: 'safe', initialSource: 'safe' },
      },
      {
        id: 'pnl-exec-safe',
        label: 'Execute · Safe account locked',
        props: { plan: 'pro-none-left', step: 'execute', lockedSource: 'safe' },
      },
      {
        id: 'pnl-exec-signer',
        label: 'Execute · Signer wallet only',
        props: { plan: 'pro-none-left', step: 'execute', lockedSource: 'signer' },
      },
    ],
  },
]

export const getScreen = (id: string): Screen =>
  CASES.flatMap(({ screens }) => screens).find((screen) => screen.id === id) ?? CASES[0].screens[0]

/** FeeScreen with a floating "Jump to" menu, grouped by case, so every screen is reachable in full-screen mode. */
export const FeePrototype = ({ screenId }: { screenId: string }): ReactElement => {
  const [current, setCurrent] = useState(() => getScreen(screenId))
  const currentCase = CASES.find(({ screens }) => screens.some(({ id }) => id === current.id))

  return (
    <>
      <FeeScreen screenId={current.id} {...current.props} />

      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-card shadow-lg">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Jump to: {currentCase?.label} · {current.label}
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className="max-h-[70vh] overflow-y-auto">
            {CASES.map((feeCase, index) => (
              <DropdownMenuGroup key={feeCase.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{feeCase.label}</DropdownMenuLabel>
                {feeCase.screens.map((screen) => (
                  <DropdownMenuItem key={screen.id} onClick={() => setCurrent(screen)}>
                    {screen.id === current.id && <Check className="size-4" />}
                    {screen.label}
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
