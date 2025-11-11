import { Grid2, Button } from '@mui/material'
import HubSpotForm from '@/features/hypernative/components/HubSpotForm/HubSpotForm'
import css from './styles.module.css'

export type HnSignupFormProps = {
  portalId: string
  formId: string
  region?: string
  onCancel?: () => void
  onSubmit?: () => void
}

const HnSignupForm = ({ portalId, formId, region = 'eu1', onCancel, onSubmit }: HnSignupFormProps) => {
  return (
    <Grid2 container className={css.container}>
      {/* Left Column - HubSpot Form */}
      <Grid2 size="grow" className={css.formColumn}>
        <div className={css.formWrapper}>
          <HubSpotForm portalId={portalId} formId={formId} region={region} onSubmit={onSubmit} />
          {onCancel && (
            <div className={css.cancelButtonWrapper}>
              <Button variant="text" onClick={onCancel} className={css.cancelButton}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Grid2>

      {/* Right Column - Background Image */}
      <Grid2 className={css.backgroundColumn} />
    </Grid2>
  )
}

export default HnSignupForm
