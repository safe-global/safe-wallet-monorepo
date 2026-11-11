import type { ReactElement, ReactNode } from 'react'
import { Lock, RotateCcw } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Field, FieldError, FieldLabel } from '@safe-global/views/components/ui/field'
import { Input } from '@safe-global/views/components/ui/input'
import { Typography } from '@safe-global/views/components/ui/typography'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { cn } from '@safe-global/views/utils/cn'
import type {
  GasDetailName,
  GasDetailRow,
  GasDetailsReadOnlyReason,
  GasFeeDetails,
  GasParamError,
  GasParamField,
} from '@safe-global/views/features/fee-payment/types'
import css from './styles.module.css'

const GAS_DETAIL_LABEL: Record<GasDetailName, string> = {
  userNonce: 'Wallet nonce',
  gasLimit: 'Gas limit',
  maxPriorityFeePerGas: 'Max priority fee (Gwei)',
  maxFeePerGas: 'Max fee (Gwei)',
  gasPrice: 'Gas price (Gwei)',
}

const READ_ONLY_NOTE: Record<GasDetailsReadOnlyReason, string> = {
  PAID_FROM_SAFE: "Paid from your Safe account. Set at signing, so it can't be changed.",
  SPONSORED_PLAN: 'Covered by your Pro plan.',
  SPONSORED_FREE: 'Covered by a free transaction.',
}

const paramErrorText = (name: GasDetailName, error: GasParamError): string => {
  switch (error) {
    case 'REQUIRED':
      return name === 'gasLimit' ? 'Enter a gas limit to continue' : 'Enter an amount'
    case 'NOT_INTEGER':
      return 'Enter a whole number'
    case 'BELOW_MIN_GAS_LIMIT':
      return 'At least 21000'
    case 'INVALID_AMOUNT':
      return 'Enter a valid amount'
    case 'BELOW_PRIORITY_FEE':
      return 'Must be at least the priority fee'
  }
}

const rowValue = (row: GasDetailRow): string => {
  if (row.error) return 'Cannot estimate'
  return row.value ?? '-'
}

const ParamInput = ({
  field,
  onChange,
  onEnter,
}: {
  field: GasParamField
  onChange: (name: GasDetailName, value: string) => void
  onEnter: () => void
}): ReactElement => (
  <Field data-invalid={!!field.error} className="gap-1.5">
    <FieldLabel htmlFor={`gas-param-${field.name}`}>{GAS_DETAIL_LABEL[field.name]}</FieldLabel>
    <Input
      id={`gas-param-${field.name}`}
      data-testid={`gas-param-${field.name}`}
      inputSize="sm"
      variant="surface"
      inputMode={field.name === 'userNonce' || field.name === 'gasLimit' ? 'numeric' : 'decimal'}
      value={field.value}
      autoFocus={field.autoFocus}
      aria-invalid={!!field.error}
      onChange={(e) => onChange(field.name, e.target.value)}
      // The card sits inside the transaction form: Enter saves the settings instead of submitting the transaction.
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return
        e.preventDefault()
        onEnter()
      }}
    />
    {field.error && <FieldError>{paramErrorText(field.name, field.error)}</FieldError>}
  </Field>
)

const GasParamsEditor = ({ details }: { details: Extract<GasFeeDetails, { mode: 'edit' }> }): ReactElement => (
  <div className="flex flex-col gap-4 pt-1 pb-3" data-testid="gas-params-editor">
    <div className="grid grid-cols-2 gap-3">
      {details.fields.map((field) => (
        <ParamInput
          key={field.name}
          field={field}
          onChange={details.onFieldChange}
          onEnter={() => details.canSave && details.onSave()}
        />
      ))}
    </div>
    <Typography variant="paragraph-small">
      <ExternalLink href={HelpCenterArticle.ADVANCED_PARAMS}>
        How can I configure these parameters manually?
      </ExternalLink>
    </Typography>
    <div className="flex items-center gap-2">
      {details.onReset && (
        <Button type="button" variant="ghost-muted" size="xs" onClick={details.onReset} data-testid="gas-params-reset">
          <RotateCcw />
          Reset to estimate
        </Button>
      )}
      <div className="ml-auto flex gap-2">
        <Button type="button" variant="outline" size="xs" onClick={details.onCancel} data-testid="gas-params-cancel">
          Cancel
        </Button>
        <Button
          type="button"
          size="xs"
          onClick={details.onSave}
          disabled={!details.canSave}
          data-testid="gas-params-save"
        >
          Save
        </Button>
      </div>
    </div>
  </div>
)

const GasParamsSummary = ({ details }: { details: Extract<GasFeeDetails, { mode: 'view' }> }): ReactElement => (
  <div className="flex flex-col gap-3 pt-1 pb-3" data-testid="gas-params-summary">
    <div className="flex flex-col gap-1">
      {details.rows.map((row) => (
        <div key={row.name} className="flex items-center justify-between">
          <Typography variant="paragraph-small" color="muted">
            {GAS_DETAIL_LABEL[row.name]}
          </Typography>
          <Typography variant="paragraph-small">{rowValue(row)}</Typography>
        </div>
      ))}
    </div>
    <div className="flex items-center gap-1.5">
      <Lock className="size-3.5 shrink-0 text-muted-foreground" />
      <Typography variant="paragraph-mini" color="muted">
        {READ_ONLY_NOTE[details.reason]}
      </Typography>
    </div>
  </div>
)

const DETAILS_BUTTON = {
  edit: { ariaLabel: 'Edit gas settings', text: 'Edit', className: 'border border-border bg-card shadow-xs' },
  view: { ariaLabel: 'View gas details', text: 'View', className: 'bg-foreground/[0.08]' },
}

/** The Gas fee row and its details in one box: the whole row toggles them, the pill says whether they can be edited. */
export const ExpandableGasFeeRow = ({
  label,
  value,
  details,
}: {
  label: ReactNode
  value: ReactNode
  details: GasFeeDetails
}): ReactElement => {
  const { ariaLabel, text, className } = DETAILS_BUTTON[details.mode]
  return (
    // One gray box for the row and its panel: on hover, and while the panel is mounted (open or closing).
    <Collapsible
      open={details.open}
      onOpenChange={details.onOpenChange}
      data-testid="gas-fee-row"
      className="-mx-2 rounded-md px-2 transition-colors duration-200 hover:bg-muted has-[[data-slot=collapsible-content]]:bg-muted has-[[data-slot=collapsible-trigger]:focus-visible]:ring-2 has-[[data-slot=collapsible-trigger]:focus-visible]:ring-ring motion-reduce:transition-none"
    >
      <CollapsibleTrigger
        aria-label={ariaLabel}
        data-testid="gas-fee-details-toggle"
        nativeButton={false}
        render={<div />}
        className={cn(css.feeRow, 'group/gas-fee cursor-pointer outline-none')}
      >
        <span className="flex items-center gap-2">
          {label}
          <span
            aria-hidden
            data-testid={`gas-fee-${details.mode}-button`}
            className={cn(
              'inline-flex h-5 items-center rounded-full px-2 text-xs leading-none font-medium text-muted-foreground transition-colors group-hover/gas-fee:text-foreground',
              details.mode === 'edit' && 'group-data-[panel-open]/gas-fee:hidden',
              className,
            )}
          >
            {details.mode === 'view' ? (
              <>
                <span className="group-data-[panel-open]/gas-fee:hidden">{text}</span>
                <span className="hidden group-data-[panel-open]/gas-fee:inline">Hide</span>
              </>
            ) : (
              text
            )}
          </span>
        </span>
        {value}
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-[420ms] ease-soft data-ending-style:h-0 data-ending-style:duration-[320ms] data-ending-style:ease-in-out data-starting-style:h-0 motion-reduce:transition-none">
        {details.mode === 'edit' ? <GasParamsEditor details={details} /> : <GasParamsSummary details={details} />}
      </CollapsibleContent>
    </Collapsible>
  )
}
