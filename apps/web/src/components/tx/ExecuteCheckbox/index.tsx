import { type ReactElement } from 'react'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setTransactionExecution } from '@/store/settingsSlice'
import { ExecuteCheckboxView } from '@views/components/tx/ExecuteCheckbox/ExecuteCheckboxView'

const ExecuteCheckbox = ({ onChange }: { onChange: (checked: boolean) => void }): ReactElement => {
  const settings = useAppSelector(selectSettings)
  const dispatch = useAppDispatch()

  const handleChange = (value: unknown) => {
    const checked = value === 'true'
    trackEvent({ ...MODALS_EVENTS.TOGGLE_EXECUTE_TX, label: checked })
    dispatch(setTransactionExecution(checked))
    onChange(checked)
  }

  return <ExecuteCheckboxView value={String(settings.transactionExecution)} onValueChange={handleChange} />
}

export default ExecuteCheckbox
