import { Controller, useFormContext } from 'react-hook-form'
import CosignerServiceField from '@safe-global/views/features/policy-cosigner/components/CosignerServiceField'
import { resolveCosignerServiceUrl } from '@safe-global/utils/features/policy-cosigner/constants'
import { useCurrentChain } from '@/hooks/useChains'
import { EnvVariablesField } from './index'

type CosignerSectionProps = {
  onReset: () => void
  showResetButton: boolean
}

const CosignerSection = ({ onReset, showResetButton }: CosignerSectionProps) => {
  const chain = useCurrentChain()
  const { control } = useFormContext()

  return (
    <Controller
      name={EnvVariablesField.cosignerUrl}
      control={control}
      render={({ field }) => (
        <CosignerServiceField
          name={field.name}
          value={field.value || ''}
          onChange={field.onChange}
          onBlur={field.onBlur}
          onReset={onReset}
          showResetButton={showResetButton}
          defaultUrl={resolveCosignerServiceUrl(chain?.chainId)}
          chainName={chain?.chainName}
        />
      )}
    />
  )
}

export default CosignerSection
