import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AddIcon from '@/public/images/common/add.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { ArrowLeft as ArrowBackIcon } from 'lucide-react'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'

type ThresholdField = Pick<ControllerRenderProps, 'value' | 'onChange'>

export type OwnerPolicyStepViewProps = {
  formId: string
  onSubmit: FormEventHandler<HTMLFormElement>
  onBack: () => void
  onAddSigner: () => void
  isDisabled: boolean
  ownerRows: ReactNode
  ownerCount: number
  renderThresholdController: (render: (field: ThresholdField) => ReactElement) => ReactNode
}

export function OwnerPolicyStepView({
  formId,
  onSubmit,
  onBack,
  onAddSigner,
  isDisabled,
  ownerRows,
  ownerCount,
  renderThresholdController,
}: OwnerPolicyStepViewProps): ReactElement {
  const ownerIndexes = Array.from({ length: ownerCount }, (_, idx) => idx)

  return (
    <form data-testid="owner-policy-step-form" onSubmit={onSubmit} id={formId}>
      <div className={layoutCss.row}>
        {ownerRows}
        <Button data-testid="add-new-signer" variant="ghost" onClick={onAddSigner} size="lg">
          <AddIcon className="size-4" />
          Add new signer
        </Button>
      </div>

      <Separator />
      <div className={layoutCss.row}>
        <Typography variant="h4" className="inline-flex items-center gap-2">
          Threshold
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="flex text-[var(--color-border-main)]">
                  <InfoIcon className="size-4" />
                </span>
              }
            />
            <TooltipContent>
              The threshold of a Safe account specifies how many signers need to confirm a Safe account transaction
              before it can be executed.
            </TooltipContent>
          </Tooltip>
        </Typography>
        <Typography variant="paragraph-small" className="mb-4 block">
          Any transaction requires the confirmation of:
        </Typography>
        <div className="flex flex-row items-center gap-4 pt-2">
          <div>
            {renderThresholdController((field) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger data-testid="threshold-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ownerIndexes.map((idx) => (
                    <SelectItem data-testid="threshold-item" key={idx + 1} value={idx + 1}>
                      {idx + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
          <div>
            <Typography>
              out of {ownerCount} signer{maybePlural(ownerCount)}
            </Typography>
          </div>
        </div>
      </div>
      <Separator />
      <div className={layoutCss.row}>
        <div className="flex flex-row justify-between gap-6">
          <Button data-testid="back-btn" variant="outline" size="lg" onClick={onBack}>
            <ArrowBackIcon className="size-4" />
            Back
          </Button>
          <Button data-testid="next-btn" type="submit" variant="default" size="lg" disabled={isDisabled}>
            Next
          </Button>
        </div>
      </div>
    </form>
  )
}
