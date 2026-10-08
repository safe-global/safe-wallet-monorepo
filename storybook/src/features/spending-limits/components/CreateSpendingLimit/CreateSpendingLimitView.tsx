import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import type { ResetTimeOption } from '@/features/spending-limits/constants'

export type ResetTimeField = {
  value: string
  onChange: (...event: unknown[]) => void
}

export type CreateSpendingLimitViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  renderBeneficiaryInput: (label: string) => ReactNode
  tokenAmountInput: ReactNode
  resetTimeOptions: ResetTimeOption[]
  renderResetTimeController: (renderSelect: (field: ResetTimeField) => ReactElement) => ReactNode
  isValid: boolean
}

export const CreateSpendingLimitView = ({
  onSubmit,
  renderBeneficiaryInput,
  tokenAmountInput,
  resetTimeOptions,
  renderResetTimeController,
  isValid,
}: CreateSpendingLimitViewProps) => {
  return (
    <TxCard>
      <form onSubmit={onSubmit}>
        <div className="mb-6 w-full">{renderBeneficiaryInput('Beneficiary')}</div>

        {tokenAmountInput}

        <Typography variant="h4" className="mt-6 font-bold">
          Reset Timer
        </Typography>
        <Typography>Set a reset time so the allowance automatically refills after the defined time period.</Typography>
        <div className="mt-2 flex items-center justify-start gap-2">
          <Label>Time Period</Label>
          {renderResetTimeController((field) => (
            <Select items={resetTimeOptions} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger data-testid="time-period-section" className="font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resetTimeOptions.map((resetTime) => (
                  <SelectItem data-testid="time-period-item" key={resetTime.value} value={resetTime.value}>
                    {resetTime.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        <TxCardActions>
          <Button data-testid="next-btn" type="submit" disabled={!isValid}>
            Next
          </Button>
        </TxCardActions>
      </form>
    </TxCard>
  )
}
