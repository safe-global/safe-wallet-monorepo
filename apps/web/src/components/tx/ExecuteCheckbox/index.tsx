import { type ReactElement } from 'react'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setTransactionExecution } from '@/store/settingsSlice'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'

const ExecuteCheckbox = ({ onChange }: { onChange: (checked: boolean) => void }): ReactElement => {
  const settings = useAppSelector(selectSettings)
  const dispatch = useAppDispatch()

  const handleChange = (value: unknown) => {
    const checked = value === 'true'
    trackEvent({ ...MODALS_EVENTS.TOGGLE_EXECUTE_TX, label: checked })
    dispatch(setTransactionExecution(checked))
    onChange(checked)
  }

  return (
    <>
      <Typography>Would you like to execute the transaction immediately?</Typography>

      <RadioGroup
        value={String(settings.transactionExecution)}
        onValueChange={handleChange}
        className="grid grid-cols-2 gap-4"
      >
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

export default ExecuteCheckbox
