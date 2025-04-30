import GasParams from '@/components/tx/GasParams'
import { useHasFeature } from '@/hooks/useChains'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useState } from 'react'
import AdvancedParamsForm from './AdvancedParamsForm'
import { type AdvancedParameters } from './types'
import { FEATURES } from '@safe-global/utils/utils/chains'

type Props = {
  params: AdvancedParameters
  recommendedGasLimit?: AdvancedParameters['gasLimit']
  willExecute: boolean
  onFormSubmit: (data: AdvancedParameters) => void
  gasLimitError?: Error
  willRelay?: boolean
}

const AdvancedParams = ({
  params,
  recommendedGasLimit,
  willExecute,
  onFormSubmit,
  gasLimitError,
  willRelay,
}: Props) => {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const isEIP1559 = useHasFeature(FEATURES.EIP1559)

  const onEditOpen = () => {
    setIsEditing(true)
    trackEvent(MODALS_EVENTS.EDIT_ADVANCED_PARAMS)
  }

  const onAdvancedSubmit = (data: AdvancedParameters) => {
    onFormSubmit(data)
    setIsEditing(false)
  }

  return isEditing ? (
    <AdvancedParamsForm
      params={params}
      isExecution={willExecute}
      recommendedGasLimit={recommendedGasLimit}
      onSubmit={onAdvancedSubmit}
      isEIP1559={isEIP1559}
      willRelay={willRelay}
    />
  ) : (
    <GasParams
      params={params}
      isExecution={willExecute}
      isEIP1559={isEIP1559}
      gasLimitError={gasLimitError}
      onEdit={onEditOpen}
      willRelay={willRelay}
    />
  )
}

export default AdvancedParams

export * from './useAdvancedParams'

export * from './types'
