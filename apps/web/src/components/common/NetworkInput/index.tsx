import ChainIndicator from '@/components/common/ChainIndicator'
import partition from 'lodash/partition'
import { type ReactElement, useId, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NetworkInputView } from '@views/components/common/NetworkInput/NetworkInputView'

const NetworkInput = ({
  name,
  required = false,
  chainConfigs,
}: {
  name: string
  required?: boolean
  chainConfigs: (Chain & { available: boolean })[]
}): ReactElement => {
  const id = useId()
  const [testNets, prodNets] = useMemo(() => partition(chainConfigs, (config) => config.isTestnet), [chainConfigs])
  const chainIds = useMemo(() => chainConfigs.map((chain) => chain.chainId), [chainConfigs])
  const { control } = useFormContext() || {}

  return (
    <Controller
      name={name}
      rules={{ required }}
      control={control}
      render={({ field, fieldState }) => (
        <NetworkInputView
          id={id}
          required={required}
          hasError={!!fieldState.error}
          value={field.value || null}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          chainIds={chainIds}
          prodNets={prodNets}
          testNets={testNets}
          renderChain={(chainId) => <ChainIndicator chainId={chainId} />}
        />
      )}
    />
  )
}

export default NetworkInput
