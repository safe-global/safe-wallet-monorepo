import { Controller, useFormContext } from 'react-hook-form'
import { EnvVariablesField } from './index'
import { TenderlySectionView } from '@views/components/settings/EnvironmentVariables/TenderlySectionView'

type TenderlySectionProps = {
  onResetUrl: () => void
  onResetToken: () => void
  showResetUrlButton: boolean
  showResetTokenButton: boolean
}

const TenderlySection = ({
  onResetUrl,
  onResetToken,
  showResetUrlButton,
  showResetTokenButton,
}: TenderlySectionProps) => {
  const { control } = useFormContext()

  return (
    <TenderlySectionView
      urlFieldId={EnvVariablesField.tenderlyURL}
      tokenFieldId={EnvVariablesField.tenderlyToken}
      renderUrlField={(render) => (
        <Controller name={EnvVariablesField.tenderlyURL} control={control} render={({ field }) => render(field)} />
      )}
      renderTokenField={(render) => (
        <Controller name={EnvVariablesField.tenderlyToken} control={control} render={({ field }) => render(field)} />
      )}
      onResetUrl={onResetUrl}
      onResetToken={onResetToken}
      showResetUrlButton={showResetUrlButton}
      showResetTokenButton={showResetTokenButton}
    />
  )
}

export default TenderlySection
