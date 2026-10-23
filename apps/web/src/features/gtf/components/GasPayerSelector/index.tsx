import type { ReactElement, ReactNode } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { AppRoutes } from '@/config/routes'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import type { FeePayerView, GasPayerChoice, NetworkFee } from '../../types'
import { GasTokenSelector } from '../FeesPreview'
import css from './styles.module.css'

const formatResetDate = (iso: string | null): string | null => {
  if (!iso) return null
  const timestamp = Date.parse(iso)
  if (Number.isNaN(timestamp)) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(timestamp)
}

const FeeAmount = ({ fee }: { fee: NetworkFee }): ReactElement => {
  if (fee.loading) return <Skeleton className="inline-block h-4 min-w-[5em]" />
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
  return (
    <span className={css.feeAmount}>
      <Typography variant="paragraph-small-bold">
        {fee.amount} {fee.currency}
      </Typography>
      {fee.fiatAmount && (
        <Typography variant="paragraph-small" color="muted">
          {fee.fiatAmount}
        </Typography>
      )}
    </span>
  )
}

/** The one "Network fee" row of the spec, replacing Estimated / Max / Total outgoing. */
const NetworkFeeRow = ({ fee, free }: { fee?: NetworkFee; free?: boolean }): ReactElement => (
  <div className={css.feeRow} data-testid="network-fee-row">
    <Typography variant="paragraph-small" color="muted">
      Network fee
    </Typography>
    {free ? <Typography variant="paragraph-small-bold">Free</Typography> : fee ? <FeeAmount fee={fee} /> : null}
  </div>
)

const Option = ({
  value,
  children,
  testId,
}: {
  value: GasPayerChoice
  children: ReactNode
  testId: string
}): ReactElement => (
  <Label data-testid={testId} className={css.option}>
    <RadioGroupItem value={value} />
    <Typography className={css.optionLabel}>{children}</Typography>
  </Label>
)

const Message = ({ children, testId }: { children: ReactNode; testId?: string }): ReactElement => (
  <Typography variant="paragraph-small" color="muted" className={css.message} data-testid={testId}>
    {children}
  </Typography>
)

const ProUpsell = ({ children }: { children: ReactNode }): ReactElement => (
  <div className={css.upsell} data-testid="fee-payer-upsell">
    <Typography variant="paragraph-small">{children}</Typography>
    <Button variant="outline" size="xs" render={<NextLink href={AppRoutes.welcome.spaces} />}>
      Upgrade to
      <span className="block h-4 w-6" aria-label="Safe Pro">
        <ProChip className="size-full" />
      </span>
      <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
    </Button>
  </div>
)

/**
 * Who pays the network fee, one screen per state of the fee payment spec. Two options render as a
 * toggle; one option renders as text, never as a lone radio; a locked fee renders as a read-only line.
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
  switch (view.kind) {
    case 'locked':
      return (
        <div className={css.locked} data-testid="fee-payer-locked">
          <div className={css.feeRow}>
            <Typography variant="paragraph-small-bold">Paid from Safe</Typography>
            <FeeAmount fee={view.fee} />
          </div>
          <Message>Fee was set at signing and can&apos;t be changed.</Message>
        </div>
      )

    case 'sponsored_info':
      return (
        <div className={css.single} data-testid="fee-payer-sponsored-info">
          <Typography variant="paragraph-small-bold">Network fee: free, sponsored by Pro</Typography>
        </div>
      )

    case 'sponsored_toggle':
      return (
        <div className={css.container} data-testid="fee-payer-sponsored-toggle">
          <RadioGroup
            value={view.choice}
            onValueChange={(value) => onChoiceChange(value as GasPayerChoice)}
            className={css.toggle}
          >
            <Option value="SPONSORED" testId="fee-payer-sponsored">
              Sponsored <span className={css.counter}>· {view.counter}</span>
            </Option>
            <Option value="WALLET" testId="fee-payer-signer">
              Pay from signer
            </Option>
          </RadioGroup>
          <NetworkFeeRow free={view.choice === 'SPONSORED'} fee={view.signerFee} />
        </div>
      )

    case 'safe_toggle':
      return (
        <div className={css.container} data-testid="fee-payer-safe-toggle">
          <RadioGroup
            value={view.choice}
            onValueChange={(value) => onChoiceChange(value as GasPayerChoice)}
            className={css.toggle}
          >
            <Option value="WALLET" testId="fee-payer-signer">
              Pay from signer
            </Option>
            <Option value="PAY_FROM_SAFE" testId="fee-payer-safe">
              Pay from Safe
              {view.premium && <span className={css.counter}>+ premium</span>}
            </Option>
          </RadioGroup>
          {view.choice === 'PAY_FROM_SAFE' && view.gasTokens.length > 0 && (
            <div className={css.feeRow} data-testid="fee-token-row">
              <Typography variant="paragraph-small" color="muted">
                Fee token
              </Typography>
              <GasTokenSelector
                availableGasTokens={view.gasTokens}
                selectedGasToken={view.selectedGasToken}
                onGasTokenChange={onGasTokenChange}
                locked={view.gasTokens.length === 1}
                forcedDisplay={view.gasTokens.length === 1 ? view.gasTokens[0] : undefined}
              />
            </div>
          )}
          <NetworkFeeRow fee={view.choice === 'PAY_FROM_SAFE' ? view.safeFee : view.signerFee} />
          {view.choice === 'PAY_FROM_SAFE' && view.reachesThreshold && (
            <Message testId="fee-payer-sign-and-execute">
              Fee is paid from Safe. No gas needed from your wallet.
            </Message>
          )}
        </div>
      )

    case 'signer_only':
      return (
        <div className={css.container} data-testid="fee-payer-signer-only">
          <div className={css.single}>
            <Typography variant="paragraph-small-bold">Pay from signer</Typography>
          </div>
          <NetworkFeeRow fee={view.signerFee} />
          {view.reason === 'quota' ? (
            <Message testId="fee-payer-quota">
              No sponsored transactions left.
              {view.resetsAt && ` Resets ${formatResetDate(view.resetsAt)}.`} Your connected wallet pays the fee.
            </Message>
          ) : (
            <ProUpsell>Sponsored transactions are included in Pro</ProUpsell>
          )}
        </div>
      )
  }
}

export default GasPayerSelector
