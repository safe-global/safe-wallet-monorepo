import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import InfoIcon from '@/public/images/notifications/info.svg'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type ChooseThresholdFieldViewProps = {
  value: number
  onValueChange: (value: number | null) => void
  ownerCount: number
  threshold: number
  error?: string
  isDirty: boolean
}

export const ChooseThresholdFieldView = ({
  value,
  onValueChange,
  ownerCount,
  threshold,
  error,
  isDirty,
}: ChooseThresholdFieldViewProps): ReactElement => {
  const isError = !!error

  return (
    <div className="flex flex-row flex-wrap items-center gap-4">
      <div>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger data-testid="threshold-selector" aria-invalid={isError}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: ownerCount }).map((_, idx) => (
              <SelectItem data-testid="threshold-item" key={idx + 1} value={idx + 1}>
                {idx + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Typography>
          out of {ownerCount} signer{maybePlural(ownerCount)}
        </Typography>
      </div>
      <div className="w-full">
        {isError ? (
          <Typography className="mb-4 text-destructive">{error}</Typography>
        ) : (
          <Typography className="mb-4">
            {isDirty ? 'Previous policy was ' : 'Current policy is '}
            <b>
              {threshold} out of {ownerCount}
            </b>
            .
          </Typography>
        )}
      </div>
    </div>
  )
}

export type ChooseThresholdViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  thresholdField: ReactNode
  nextDisabled: boolean
}

export const ChooseThresholdView = ({
  onSubmit,
  thresholdField,
  nextDisabled,
}: ChooseThresholdViewProps): ReactElement => {
  return (
    <TxCard>
      <div>
        <Typography variant="h3" className="inline-flex items-center gap-1 font-bold">
          Threshold
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="flex text-[var(--color-border-main)]">
                  <InfoIcon className="size-4" />
                </span>
              }
            />
            <TooltipContent>{TOOLTIP_TITLES.THRESHOLD}</TooltipContent>
          </Tooltip>
        </Typography>

        <Typography>Any transaction will require the confirmation of:</Typography>
      </div>
      <form onSubmit={onSubmit}>
        <div className="mb-4">{thresholdField}</div>

        <Separator bleed="6" />

        <TxCardActions>
          <Button data-testid="threshold-next-btn" type="submit" disabled={nextDisabled}>
            Next
          </Button>
        </TxCardActions>
      </form>
    </TxCard>
  )
}
