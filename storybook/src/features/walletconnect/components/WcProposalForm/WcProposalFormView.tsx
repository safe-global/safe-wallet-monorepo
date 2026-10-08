import type { ReactElement, ReactNode } from 'react'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Field, FieldLabel } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

export type WcProposalFormViewProps = {
  peerName: string
  iconUrl?: string
  origin: string
  verification: ReactNode
  compatibilityWarning: ReactNode
  showRiskCheckbox: boolean
  riskCheckboxId: string
  understandsRisk: boolean
  onRiskCheckboxChange: (checked: boolean) => void
  renderBlockedAddress?: (featureTitle: string) => ReactNode
  isUnsupportedChain: boolean
  approveDisabled: boolean
  isBusy: boolean
  isApproving: boolean
  isRejecting: boolean
  onApprove: () => void
  onReject: () => void
}

export const WcProposalFormView = ({
  peerName,
  iconUrl,
  origin,
  verification,
  compatibilityWarning,
  showRiskCheckbox,
  riskCheckboxId,
  understandsRisk,
  onRiskCheckboxChange,
  renderBlockedAddress,
  isUnsupportedChain,
  approveDisabled,
  isBusy,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
}: WcProposalFormViewProps): ReactElement => {
  const name = peerName || 'Unknown dApp'

  return (
    <div className={css.container}>
      <Typography variant="paragraph-small" className="text-muted-foreground">
        WalletConnect
      </Typography>

      {iconUrl && (
        <div className={css.icon}>
          <SafeAppIconCard src={iconUrl} width={32} height={32} alt={`${name || 'dApp'} logo`} />
        </div>
      )}

      <Typography className="mb-2">
        <b>{name}</b> wants to connect
      </Typography>

      <Typography className={`mb-6 ${css.origin}`}>{origin}</Typography>

      <div className={css.info}>
        {verification}

        {compatibilityWarning}
      </div>

      {showRiskCheckbox && (
        <Field orientation="horizontal" className={css.checkbox}>
          <Checkbox id={riskCheckboxId} checked={understandsRisk} onCheckedChange={onRiskCheckboxChange} />
          <FieldLabel htmlFor={riskCheckboxId}>
            I understand the risks associated with interacting with this dApp and would like to continue.
          </FieldLabel>
        </Field>
      )}

      {renderBlockedAddress?.('Safe{Pass}')}

      <Separator className={css.divider} />

      <div className={css.buttons}>
        {!isUnsupportedChain && (
          <Button
            variant="default"
            onClick={onApprove}
            // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke values have no variant
            className="py-[var(--space-1)] px-[var(--space-4)] min-w-[130px]"
            disabled={approveDisabled}
          >
            {isApproving ? <Spinner className="size-5" /> : 'Approve'}
          </Button>
        )}

        <Button
          variant={isUnsupportedChain ? 'ghost' : 'destructive'}
          onClick={onReject}
          // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke values have no variant
          className="py-[var(--space-1)] px-[var(--space-4)] min-w-[130px]"
          disabled={isBusy}
        >
          {isRejecting ? <Spinner className="size-5" /> : isUnsupportedChain ? 'Close' : 'Reject'}
        </Button>
      </div>
    </div>
  )
}
