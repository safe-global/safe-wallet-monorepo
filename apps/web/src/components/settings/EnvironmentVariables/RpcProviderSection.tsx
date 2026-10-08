import { Controller, useFormContext } from 'react-hook-form'
import { useCurrentChain } from '@/hooks/useChains'
import { EnvVariablesField } from './index'
import { RpcProviderSectionView } from '@views/components/settings/EnvironmentVariables/RpcProviderSectionView'

type RpcProviderSectionProps = {
  onReset: () => void
  showResetButton: boolean
}

const RpcProviderSection = ({ onReset, showResetButton }: RpcProviderSectionProps) => {
  const chain = useCurrentChain()
  const { control } = useFormContext()

  return (
    <RpcProviderSectionView
      placeholder={chain?.rpcUri.value}
      onReset={onReset}
      showResetButton={showResetButton}
      renderField={(render) => (
        <Controller name={EnvVariablesField.rpc} control={control} render={({ field }) => render(field)} />
      )}
    />
  )
}

export default RpcProviderSection
