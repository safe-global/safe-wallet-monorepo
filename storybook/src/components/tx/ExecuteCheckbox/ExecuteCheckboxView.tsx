import { type ReactElement } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'

export type ExecuteCheckboxViewProps = {
  value: string
  onValueChange: (value: unknown) => void
}

export const ExecuteCheckboxView = ({ value, onValueChange }: ExecuteCheckboxViewProps): ReactElement => {
  return (
    <>
      <Typography>Would you like to execute the transaction immediately?</Typography>

      <RadioGroup value={value} onValueChange={onValueChange} className="grid grid-cols-2 gap-4">
        <Label className={css.radio} data-testid="execute-checkbox">
          <RadioGroupItem value="true" />
          <span>
            Yes, <b>execute</b>
          </span>
        </Label>
        <Label className={css.radio} data-testid="sign-checkbox">
          <RadioGroupItem value="false" />
          <span>No, later</span>
        </Label>
      </RadioGroup>
    </>
  )
}
