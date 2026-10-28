import type { ReactElement, ReactNode } from 'react'
import NextLink from 'next/link'
import { ArrowRight, ChevronDown, Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
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
import {
  EXECUTION_FEE_TOOLTIP,
  GAS_FEE_TOOLTIP,
} from '@safe-global/views/features/pay-from-safe/components/shared/tooltips'
import { AppRoutes } from '@/config/routes'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import SponsoredTxsCounter from '@/components/tx/SponsoredTxsCounter'
import Track from '@/components/common/Track'
import { MixpanelEventParams, PlanSelectionEntryPoint, UpgradeFeature, UpgradeLocation } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import type { FeePayerControl, FeePayerView, GasPayerChoice, NetworkFee } from '../../types'
import { GasTokenSelector, TotalOutgoingSection } from '../FeesPreview'
import feesCss from '../FeesPreview/styles.module.css'
import css from './styles.module.css'

const PAYER_LABEL: Record<GasPayerChoice, string> = {
  PAY_FROM_SAFE: 'Safe account',
  WALLET: 'Signer wallet',
  SPONSORED: 'Pro plan',
}

type SponsorKind = FeePayerView['sponsorKind']

/** A sponsored payer is the plan on a Pro Workspace, or the chain's free relays otherwise. */
const payerLabel = (choice: GasPayerChoice, sponsorKind: SponsorKind): string =>
  choice === 'SPONSORED' && sponsorKind === 'free' ? 'Free transaction' : PAYER_LABEL[choice]

/** Why the locked pill cannot be changed, per payer. */
const LOCKED_TOOLTIP: Record<GasPayerChoice, string> = {
  PAY_FROM_SAFE: "Set at signing and can't be changed.",
  WALLET: 'Whoever executes pays the gas fee.',
  SPONSORED: 'Covered by your sponsored transactions.',
}

const PAYER_TEST_ID: Record<GasPayerChoice, string> = {
  PAY_FROM_SAFE: 'fee-payer-safe',
  WALLET: 'fee-payer-signer',
  SPONSORED: 'fee-payer-sponsored',
}

const UPGRADE_PROMPT = {
  [MixpanelEventParams.FEATURE]: UpgradeFeature.SPONSORED_TX,
  [MixpanelEventParams.LOCATION]: UpgradeLocation.TX_FLOW_GAS,
}

const PillLabel = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small-bold" className="tracking-[0.1px]">
    {children}
  </Typography>
)

/** The "Pay fees from" dropdown: the same pill as the fee token selector, with the payer options. */
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
      render={
        <div
          role="button"
          tabIndex={0}
          className={cn(feesCss.paymentSourceSelector, css.payerPill)}
          // Inline: `.paymentSourceSelector` fixes a width and CSS-module order decides which rule wins.
          style={{ width: 'auto' }}
        />
      }
    >
      <PillLabel>{payerLabel(value, sponsorKind)}</PillLabel>
      <ChevronDown className={feesCss.selectorCaret} />
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start">
      {options.map((option) => (
        <DropdownMenuItem
          key={option}
          onClick={() => onChange(option)}
          className={feesCss.selectorMenuItem}
          data-testid={PAYER_TEST_ID[option]}
        >
          <Typography variant="paragraph-small-bold">{payerLabel(option, sponsorKind)}</Typography>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

/** The same pill with no menu: what a later signer or the executor sees once there is nothing to choose. */
const LockedPill = ({ children, tooltip }: { children: ReactNode; tooltip: string }): ReactElement => (
  <Tooltip>
    <TooltipTrigger
      render={
        <div
          className={cn(feesCss.paymentSourceSelector, feesCss.gasTokenSelectorLocked, css.payerPill)}
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
    <LockedPill tooltip={LOCKED_TOOLTIP[control.value]}>
      <PillLabel>{payerLabel(control.value, sponsorKind)}</PillLabel>
    </LockedPill>
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
  <Typography variant="paragraph-small" className={css.feeLabel}>
    {label}
    <Tooltip>
      <TooltipTrigger render={<span className={feesCss.tooltipIcon} />}>
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
  // Sponsored: the fee somebody else pays, struck through; the Pro chip only when the plan pays it.
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

/** The free plan's strip: what Pro gives, and the way to it. */
const ProUpsell = (): ReactElement => {
  useTrackOnce(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, UPGRADE_PROMPT, true)

  return (
    <div className={css.upsell} data-testid="fee-payer-upsell">
      <Typography variant="paragraph-small">Don&apos;t pay gas fees. Get sponsored transactions with Pro.</Typography>
      <Track
        {...SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED}
        mixpanelParams={{
          [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT,
          ...UPGRADE_PROMPT,
        }}
        className="shrink-0"
      >
        <Button variant="outline" size="xs" render={<NextLink href={AppRoutes.welcome.spaces} />}>
          Upgrade to
          <span className="block h-4 w-6" aria-label="Safe Pro">
            <ProChip className="size-full" />
          </span>
          <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
        </Button>
      </Track>
    </div>
  )
}

/**
 * The fee card of the fee payment design: who pays and in which token, the Execution and Gas fee rows,
 * the total leaving the Safe, and the plan strip (Pro upsell or sponsored counter). Two payers render
 * as a dropdown; one renders as a locked pill with the reason in its tooltip.
 */
const GasPayerSelector = ({
  view,
  onChoiceChange,
  onGasTokenChange,
}: {
  view: FeePayerView
  onChoiceChange: (choice: GasPayerChoice) => void
  onGasTokenChange?: (address: string) => void
}): ReactElement => {
  const { payer, gasToken, executionFee, gasFee, sponsored, sponsorKind, totalOutgoing, footer, safeHasEnoughGas } =
    view
  const singleToken = gasToken.tokens.length <= 1
  const displayedToken = gasToken.tokens.find((t) => t.address.toLowerCase() === gasToken.selected.toLowerCase())

  return (
    <div className={feesCss.container} data-testid="gas-payer-selector">
      <div className={feesCss.header}>
        <Typography variant="paragraph-small-bold">Fees</Typography>
      </div>

      <div className={css.card}>
        <div className={cn(feesCss.paymentRow, css.payerRow)}>
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
              lockedTooltip={gasToken.lockedReason}
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

          <FeeRow testId="gas-fee-row">
            <FeeLabel label="Gas fee" tooltip={GAS_FEE_TOOLTIP} />
            <FeeValue fee={gasFee} sponsored={sponsored} sponsorKind={sponsorKind} />
          </FeeRow>

          {totalOutgoing && (
            <div className={css.totalOutgoing}>
              <TotalOutgoingSection totalOutgoing={totalOutgoing} />
            </div>
          )}
        </div>

        <div className={css.footer}>
          {footer.kind === 'upsell' ? (
            <ProUpsell />
          ) : (
            <SponsoredTxsCounter
              left={footer.left}
              quota={footer.quota}
              resetsAt={footer.resetsAt}
              isSubscription={footer.isSubscription}
              isPro={footer.isSubscription}
            />
          )}
        </div>
      </div>

      {/* Safe-pays only: signing is not blocked, another signer or a top-up may cover it before execution. */}
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
