import { ChevronUp as ExpandLessIcon, ChevronDown as ExpandMoreIcon } from 'lucide-react'
import type { ComponentProps, FormEventHandler, KeyboardEventHandler, ReactElement, ReactNode } from 'react'

import TxCard, { TxCardActions } from '@views/components/tx-flow/common/TxCard'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { TOOLTIP_TITLES } from '@views/components/tx-flow/common/constants'
import Track from '@/components/common/Track'
import NumberField from '@/components/common/NumberField'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'
import { Typography } from '@/components/ui/typography'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

import css from './styles.module.css'

type SelectProps = ComponentProps<typeof Select>

export type RecoveryPeriodSelectViewProps = {
  value: SelectProps['value']
  onValueChange: SelectProps['onValueChange']
  items: Record<string, string>
  options: Array<{ label: string; value: string | number }>
  testId: string
}

export function RecoveryPeriodSelectView({
  value,
  onValueChange,
  items,
  options,
  testId,
}: RecoveryPeriodSelectViewProps): ReactElement {
  return (
    <Select value={value} onValueChange={onValueChange} items={items}>
      <SelectTrigger data-testid={testId} className="w-[55%] max-w-[240px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(({ label, value }, index) => (
          <SelectItem key={index} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export type CustomDelayFieldViewProps = Omit<ComponentProps<typeof NumberField>, 'label' | 'error'> & {
  errorMessage?: string
  hasError: boolean
}

export function CustomDelayFieldView({ errorMessage, hasError, ...field }: CustomDelayFieldViewProps): ReactElement {
  return <NumberField label={errorMessage} error={hasError} {...field} required placeholder="E.g. 100" />
}

export type UpsertRecoveryFlowSettingsViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  renderRecovererInput: (label: string) => ReactNode
  recovererWarning: ReactNode
  delaySelect: ReactNode
  isCustomDelay: boolean
  customDelayField: ReactNode
  expirySelect: ReactNode
  showAdvanced: boolean
  onShowAdvanced: () => void
  onAdvancedKeyDown: KeyboardEventHandler<HTMLElement>
  understandsRisk: boolean
  onUnderstandsRiskChange: (checked: boolean) => void
  brandName: string
  isDisabled: boolean
}

export function UpsertRecoveryFlowSettingsView({
  onSubmit,
  renderRecovererInput,
  recovererWarning,
  delaySelect,
  isCustomDelay,
  customDelayField,
  expirySelect,
  showAdvanced,
  onShowAdvanced,
  onAdvancedKeyDown,
  understandsRisk,
  onUnderstandsRiskChange,
  brandName,
  isDisabled,
}: UpsertRecoveryFlowSettingsViewProps): ReactElement {
  return (
    <TxCard>
      <form onSubmit={onSubmit}>
        <Alert variant="warning" outlined={false}>
          <AlertSeverityIcon variant="warning" />
          <AlertDescription>
            Your Recoverer will be able to reset your Account setup. Only select an address that you trust.{' '}
            <Track {...RECOVERY_EVENTS.LEARN_MORE} label="recover-setup-flow">
              <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
                Learn more
              </ExternalLink>
            </Track>
          </AlertDescription>
        </Alert>

        <div className="my-4">
          <Typography variant="h4" className="mb-2">
            Trusted Recoverer
          </Typography>

          <Typography variant="paragraph-small" className="block">
            Choose a Recoverer, such as a hardware wallet or a Safe account controlled by family or friends, that can
            initiate the recovery process in the future.
          </Typography>
        </div>

        <div className="mb-4 w-full">
          {renderRecovererInput('Recoverer address or ENS')}
          {recovererWarning}
        </div>

        <div className="mb-4">
          <Typography variant="h4" className="mb-2">
            Review window
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
              </TooltipTrigger>
              <TooltipContent>{TOOLTIP_TITLES.REVIEW_WINDOW}</TooltipContent>
            </Tooltip>
          </Typography>

          <Typography variant="paragraph-small" className="block">
            The recovery proposal will be available for execution after this period of time. You can cancel any recovery
            proposal when it is not needed or wanted during this period.
          </Typography>
        </div>

        <div className="my-4">
          {delaySelect}

          <div className="flex max-w-[180px] min-w-[140px] flex-1 gap-4">
            {isCustomDelay && (
              <>
                {customDelayField}
                <Typography className="my-auto">days.</Typography>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <Typography
            data-testid="advanced-btn"
            variant="paragraph-small"
            onClick={onShowAdvanced}
            onKeyDown={onAdvancedKeyDown}
            role="button"
            tabIndex={0}
            aria-expanded={showAdvanced}
            className={css.advanced}
          >
            Advanced {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Typography>

          <Collapsible open={showAdvanced}>
            <CollapsibleContent keepMounted>
              <div>
                <Typography variant="h4" className="mb-2">
                  Proposal expiry
                  <Tooltip>
                    <TooltipTrigger render={<span />}>
                      <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
                    </TooltipTrigger>
                    <TooltipContent>{TOOLTIP_TITLES.PROPOSAL_EXPIRY}</TooltipContent>
                  </Tooltip>
                </Typography>

                <Typography variant="paragraph-small" className="mb-4 block">
                  Set a period of time after which the recovery proposal will expire and can no longer be executed.
                </Typography>
              </div>

              {expirySelect}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <Separator bleed="6" />

        <Card data-testid="warning-section" size="none" surface="sunken" className="my-4">
          <Label htmlFor="recovery-understands-risk" className="cursor-pointer gap-3 px-2 py-2 font-normal">
            <Checkbox
              id="recovery-understands-risk"
              checked={understandsRisk}
              onCheckedChange={(checked) => onUnderstandsRiskChange(checked === true)}
              className="bg-[var(--color-background-paper)]"
            />
            <Typography variant="paragraph-small">
              {`I understand that the Recoverer will be able to initiate recovery of this Safe account and that I will only be informed within the ${brandName}.`}
            </Typography>
          </Label>
        </Card>

        <TxCardActions>
          <Button data-testid="next-btn" variant="default" type="submit" disabled={isDisabled}>
            Next
          </Button>
        </TxCardActions>
      </form>
    </TxCard>
  )
}
