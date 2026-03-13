import { Button } from '@mui/material'
import HubSpotForm from '@/features/hypernative/components/HubSpotForm/HubSpotForm'
import HnSignupLayout from './HnSignupLayout'
import css from './styles.module.css'

export type HnSignupFormProps = {
  portalId: string
  formId: string
  region?: string
  safeAddress?: string
  onCancel?: () => void
  onSubmit?: (region: string) => void
}

const HnSignupForm = ({ portalId, formId, region = 'eu1', safeAddress, onCancel, onSubmit }: HnSignupFormProps) => {
  return (
    <HnSignupLayout contentClassName={css.formColumn}>
      <div className={css.formWrapper}>
        <HubSpotForm
          portalId={portalId}
          formId={formId}
          region={region}
          safeAddress={safeAddress}
          onSubmit={onSubmit}
        />
        {onCancel && (
          <div className={css.cancelButtonWrapper}>
            <Button variant="text" onClick={onCancel} className={css.cancelButton}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </HnSignupLayout>
  )
}

export default HnSignupForm
