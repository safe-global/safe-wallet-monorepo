import type { ReactElement, ReactNode } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import ProChip from '@safe-global/views/assets/images/safe-pro/pro-chip.svg'
import {
  EXECUTION_FEE_TOOLTIP,
  GAS_FEE_TOOLTIP,
} from '@safe-global/views/features/fee-payment/components/shared/tooltips'
import type {
  FeePayerControl,
  FeePayerView,
  GasPayerChoice,
  GasTokenLockReason,
  GasTokenOption,
  NetworkFee,
  PayerLockReason,
} from '@safe-global/views/features/fee-payment/types'
import { GasTokenSelector, type TokenIconRenderer } from './GasTokenSelector'
import { TotalOutgoingSection } from './TotalOutgoingSection'
import css from './styles.module.css'

export type { TokenIconRenderer } from './GasTokenSelector'

const PAYER_LABEL: Record<GasPayerChoice, string> = {
  PAY_FROM_SAFE: 'Safe account',
  WALLET: 'Signer wallet',
  SPONSORED: 'Pro plan',
}

type SponsorKind = FeePayerView['sponsorKind']

const payerLabel = (choice: GasPayerChoice, sponsorKind: SponsorKind): string =>
  choice === 'SPONSORED' && sponsorKind === 'free' ? 'Free transaction' : PAYER_LABEL[choice]

const LOCKED_TOOLTIP: Record<GasPayerChoice, string> = {
  PAY_FROM_SAFE: "Set at signing and can't be changed.",
  WALLET: 'Whoever executes pays the gas fee.',
  SPONSORED: 'Covered by your sponsored transactions.',
}

const PAYER_LOCK_REASON_TOOLTIP: Record<PayerLockReason, string> = {
  FIRST_SIGNER_PICKS: 'Whoever signs first picks who pays the gas fee.',
}

const gasTokenLockTooltip = (reason: GasTokenLockReason | undefined, token?: GasTokenOption): string | undefined => {
  if (reason === 'SET_AT_SIGNING') return LOCKED_TOOLTIP.PAY_FROM_SAFE
  if (reason === 'SPONSORED') return LOCKED_TOOLTIP.SPONSORED
  if (reason === 'NATIVE_ONLY') return `Fees are paid in ${token?.symbol} for now. More tokens are coming soon.`
  return undefined
}

const PAYER_TEST_ID: Record<GasPayerChoice, string> = {
  PAY_FROM_SAFE: 'fee-payer-safe',
  WALLET: 'fee-payer-signer',
  SPONSORED: 'fee-payer-sponsored',
}

const PillLabel = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small-bold" className="tracking-[0.1px]">
    {children}
  </Typography>
)

const PayerChoice = ({
  value,
  options,
  sponsorKind,
  onChange,
}: {
  value: GasPayerChoice
  options: GasPayerChoice[]
  sponsorKind: SponsorKind
  onChange: (choice: GasPayerChoice) => void
}): ReactElement => (
  <DropdownMenu>
    <DropdownMenuTrigger
      data-testid="fee-payer-selector"
      nativeButton={false}
      render={
        <div
          role="button"
          tabIndex={0}
          className={cn(css.paymentSourceSelector, css.payerPill)}
          // Inline: `.paymentSourceSelector` fixes a width that the pill must not inherit.
          style={{ width: 'auto' }}
        />
      }
    >
      <PillLabel>{payerLabel(value, sponsorKind)}</PillLabel>
      <ChevronDown className={css.selectorCaret} />
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start">
      {options.map((option) => (
        <DropdownMenuItem
          key={option}
          onClick={() => onChange(option)}
          className={css.selectorMenuItem}
          data-testid={PAYER_TEST_ID[option]}
        >
          <Typography variant="paragraph-small-bold">{payerLabel(option, sponsorKind)}</Typography>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

const LockedPill = ({ children, tooltip }: { children: ReactNode; tooltip: string }): ReactElement => (
  <Tooltip>
    <TooltipTrigger
      render={
        <div
          className={cn(css.paymentSourceSelector, css.gasTokenSelectorLocked, css.payerPill)}
          style={{ width: 'auto' }}
          data-testid="fee-payer-locked"
        />
      }
    >
      {children}
      <Lock className={css.lockIcon} />
    </TooltipTrigger>
    <TooltipContent side="top">{tooltip}</TooltipContent>
  </Tooltip>
)

const PayerControl = ({
  control,
  sponsorKind,
  onChange,
}: {
  control: FeePayerControl
  sponsorKind: SponsorKind
  onChange: (choice: GasPayerChoice) => void
}): ReactElement =>
  control.kind === 'choice' ? (
    <PayerChoice value={control.value} options={control.options} sponsorKind={sponsorKind} onChange={onChange} />
  ) : (
    <LockedPill tooltip={control.reason ? PAYER_LOCK_REASON_TOOLTIP[control.reason] : LOCKED_TOOLTIP[control.value]}>
      <PillLabel>{payerLabel(control.value, sponsorKind)}</PillLabel>
    </LockedPill>
  )

const LabelledControl = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <div className={css.paymentRowGroup}>
    <Typography variant="paragraph-small" color="muted">
      {label}
    </Typography>
    {children}
  </div>
)

const FeeLabel = ({ label, tooltip }: { label: string; tooltip: string }): ReactElement => (
  <Typography variant="paragraph-small" className={css.feeLabel}>
    {label}
    <Tooltip>
      {/* Keeps a tap on the icon from toggling a clickable row it sits in. */}
      <TooltipTrigger render={<span className={css.tooltipIcon} onClick={(e) => e.stopPropagation()} />}>
        <InfoIcon className="size-4 text-[var(--color-border-main)]" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  </Typography>
)

const ProBadge = (): ReactElement => (
  <span className="block h-5 w-8 shrink-0" role="img" aria-label="Safe Pro">
    <ProChip className="size-full" />
  </span>
)

const FeeValue = ({
  fee,
  sponsored,
  sponsorKind = 'plan',
}: {
  fee: NetworkFee
  sponsored?: boolean
  sponsorKind?: SponsorKind
}): ReactElement => {
  if (fee.loading) return <Skeleton className="h-4 min-w-[7em]" />
  if (fee.error)
    return (
      <Typography variant="paragraph-small" className="text-[var(--color-warning-main)]">
        Cannot estimate
      </Typography>
    )
  if (fee.note)
    return (
      <Typography variant="paragraph-small" color="muted">
        {fee.note}
      </Typography>
    )
  if (sponsored)
    return (
      <span className={css.feeAmount}>
        <Typography variant="paragraph-small" color="muted" className="line-through">
          {fee.amount} {fee.currency}
        </Typography>
        {sponsorKind === 'plan' && <ProBadge />}
      </span>
    )
  return (
    <span className={css.feeValue}>
      <Typography variant="paragraph-small">
        {fee.amount} {fee.currency}
      </Typography>
      {fee.fiatAmount && (
        <Typography variant="paragraph-mini" color="muted">
          {fee.fiatAmount}
        </Typography>
      )}
    </span>
  )
}

const FeeRow = ({ children, testId }: { children: ReactNode; testId: string }): ReactElement => (
  <div className={css.feeRow} data-testid={testId}>
    {children}
  </div>
)

/** The free plan's strip; the app passes the upgrade button, which carries the link and tracking. */
export const ProUpsell = ({ upgradeButton }: { upgradeButton: ReactNode }): ReactElement => (
  <div className={css.upsell} data-testid="fee-payer-upsell">
    <Typography variant="paragraph-small">Don&apos;t pay gas fees. Get sponsored transactions with Pro.</Typography>
    {upgradeButton}
  </div>
)

export type GasPayerSelectorProps = {
  view: FeePayerView
  onChoiceChange: (choice: GasPayerChoice) => void
  onGasTokenChange?: (address: string) => void
  /** Fiat currency of the token balances in the token menu. */
  currency: string
  renderTokenIcon: TokenIconRenderer
  /** The strip under the fee rows (Pro upsell or sponsored counter); none when null. */
  footer: ReactNode
  /** Gas limit and fee details, revealed by the Gas fee row; the row is static without it. */
  gasFeeDetails?: ReactNode
}

const ExpandableGasFeeRow = ({
  label,
  value,
  details,
  defaultOpen,
}: {
  label: ReactNode
  value: ReactNode
  details: ReactNode
  defaultOpen: boolean
}): ReactElement => (
  <Collapsible defaultOpen={defaultOpen}>
    <CollapsibleTrigger
      aria-label="Gas fee details"
      data-testid="gas-fee-details-toggle"
      nativeButton={false}
      render={<div />}
      className={cn(
        css.feeRow,
        'group/gas-fee -mx-2 cursor-pointer rounded-md px-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {label}
      <span className="flex items-center gap-2">
        {value}
        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-[420ms] ease-soft group-data-[panel-open]/gas-fee:rotate-180 motion-reduce:transition-none" />
      </span>
    </CollapsibleTrigger>
    <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-[420ms] ease-soft data-ending-style:h-0 data-ending-style:duration-[320ms] data-ending-style:ease-in-out data-starting-style:h-0 motion-reduce:transition-none">
      {details}
    </CollapsibleContent>
  </Collapsible>
)

const GasPayerSelector = ({
  view,
  onChoiceChange,
  onGasTokenChange,
  currency,
  renderTokenIcon,
  footer,
  gasFeeDetails,
}: GasPayerSelectorProps): ReactElement => {
  const { payer, gasToken, executionFee, gasFee, sponsored, sponsorKind, totalOutgoing, safeHasEnoughGas } = view
  const singleToken = gasToken.tokens.length <= 1
  const displayedToken = gasToken.tokens.find((t) => sameAddress(t.address, gasToken.selected))

  return (
    <div className={css.container} data-testid="gas-payer-selector">
      <div className={css.header}>
        <Typography variant="paragraph-small-bold">Fees</Typography>
      </div>

      <div className={css.card}>
        <div className={cn(css.paymentRow, css.payerRow)}>
          <LabelledControl label="Pay fees from:">
            <PayerControl control={payer} sponsorKind={sponsorKind} onChange={onChoiceChange} />
          </LabelledControl>
          <LabelledControl label="Fees token:">
            <GasTokenSelector
              availableGasTokens={gasToken.tokens}
              selectedGasToken={gasToken.selected}
              onGasTokenChange={onGasTokenChange}
              locked={gasToken.locked || singleToken}
              forcedDisplay={displayedToken ?? gasToken.tokens[0]}
              lockedTooltip={gasTokenLockTooltip(gasToken.lockedReason, displayedToken ?? gasToken.tokens[0])}
              currency={currency}
              renderTokenIcon={renderTokenIcon}
            />
          </LabelledControl>
        </div>

        <Separator />

        <div className={css.rows}>
          <FeeRow testId="execution-fee-row">
            <FeeLabel label="Execution fee" tooltip={EXECUTION_FEE_TOOLTIP} />
            {executionFee.amount ? (
              <FeeValue fee={executionFee} />
            ) : (
              <Typography variant="paragraph-small" color="muted">
                Free
              </Typography>
            )}
          </FeeRow>

          {gasFeeDetails ? (
            <ExpandableGasFeeRow
              label={<FeeLabel label="Gas fee" tooltip={GAS_FEE_TOOLTIP} />}
              value={<FeeValue fee={gasFee} sponsored={sponsored} sponsorKind={sponsorKind} />}
              details={gasFeeDetails}
              defaultOpen={!!gasFee.error}
            />
          ) : (
            <FeeRow testId="gas-fee-row">
              <FeeLabel label="Gas fee" tooltip={GAS_FEE_TOOLTIP} />
              <FeeValue fee={gasFee} sponsored={sponsored} sponsorKind={sponsorKind} />
            </FeeRow>
          )}

          {totalOutgoing && (
            <div className={css.totalOutgoingWrap}>
              <TotalOutgoingSection totalOutgoing={totalOutgoing} />
            </div>
          )}
        </div>

        {footer && <div className={css.footer}>{footer}</div>}
      </div>

      {/* Not blocking: a top-up or another signer may cover it before execution. */}
      {safeHasEnoughGas === false && !gasFee.loading && (
        <Alert variant="warning" outlined={false} className="mt-2">
          <AlertSeverityIcon variant="warning" />
          <AlertDescription>
            Insufficient {gasFee.currency} balance to cover the gas fee. Top up before execution, otherwise the
            transaction will fail.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default GasPayerSelector
