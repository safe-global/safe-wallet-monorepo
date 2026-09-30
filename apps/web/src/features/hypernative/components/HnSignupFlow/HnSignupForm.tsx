import { Button } from '@/components/ui/button'
import HubSpotForm from '../HubSpotForm/HubSpotForm'
import HnSignupLayout from './HnSignupLayout'
import css from './styles.module.css'

export type HnSignupFormProps = {
  portalId: string
  formId: string
  region?: string
  onCancel?: () => void
  onSubmit?: (region: string) => void
}

const HnSignupForm = ({ portalId, formId, region = 'eu1', onCancel, onSubmit }: HnSignupFormProps) => {
  return (
    <HnSignupLayout contentClassName={css.formColumn}>
      <div className={css.formWrapper}>
        <HubSpotForm portalId={portalId} formId={formId} region={region} onSubmit={onSubmit} />
        {onCancel && (
          <div className={css.cancelButtonWrapper}>
            <Button variant="ghost" onClick={onCancel} className={css.cancelButton}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </HnSignupLayout>
  )
}

export default HnSignupForm
