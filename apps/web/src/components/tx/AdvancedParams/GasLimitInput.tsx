import useSafeInfo from '@/hooks/useSafeInfo'
import { useFormContext } from 'react-hook-form'
import { BASE_TX_GAS } from '@/config/constants'
import { AdvancedField } from '@views/components/tx/AdvancedParams/types'
import { GasLimitInputView } from '@views/components/tx/AdvancedParams/GasLimitInputView'

const GasLimitInput = ({ recommendedGasLimit }: { recommendedGasLimit?: string }) => {
  const { safe } = useSafeInfo()

  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext()

  const currentGasLimit = watch(AdvancedField.gasLimit)

  const onResetGasLimit = () => {
    setValue(AdvancedField.gasLimit, recommendedGasLimit)
    trigger(AdvancedField.gasLimit)
  }

  const error = errors.gasLimit as
    | {
        message: string
        type: string
      }
    | undefined

  const showReset = !!recommendedGasLimit && recommendedGasLimit !== currentGasLimit?.toString()

  return (
    <GasLimitInputView
      error={error}
      showReset={showReset}
      onResetGasLimit={onResetGasLimit}
      disabled={!safe.deployed}
      field={register(AdvancedField.gasLimit, { required: true, min: BASE_TX_GAS })}
    />
  )
}

export default GasLimitInput
