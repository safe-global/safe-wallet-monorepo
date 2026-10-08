import HubSpotForm from '../HubSpotForm/HubSpotForm'
import { HnSignupFormView } from '@views/features/hypernative/components/HnSignupFlow/HnSignupFormView'

export type HnSignupFormProps = {
  portalId: string
  formId: string
  region?: string
  onCancel?: () => void
  onSubmit?: (region: string) => void
}

const HnSignupForm = ({ portalId, formId, region = 'eu1', onCancel, onSubmit }: HnSignupFormProps) => {
  return (
    <HnSignupFormView
      hubSpotForm={<HubSpotForm portalId={portalId} formId={formId} region={region} onSubmit={onSubmit} />}
      onCancel={onCancel}
    />
  )
}

export default HnSignupForm
