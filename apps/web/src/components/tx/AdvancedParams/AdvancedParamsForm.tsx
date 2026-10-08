import { type SyntheticEvent } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { FLOAT_REGEX } from '@safe-global/utils/utils/validation'
import { AdvancedField, type AdvancedParameters } from '@views/components/tx/AdvancedParams/types'
import GasLimitInput from './GasLimitInput'
import { AdvancedParamsFormView } from '@views/components/tx/AdvancedParams/AdvancedParamsFormView'

type AdvancedParamsFormProps = {
  params: AdvancedParameters
  onSubmit: (params: AdvancedParameters) => void
  recommendedGasLimit?: AdvancedParameters['gasLimit']
  isExecution: boolean
  isEIP1559?: boolean
  willRelay?: boolean
}

type FormData = {
  [AdvancedField.userNonce]: number
  [AdvancedField.gasLimit]?: string
  [AdvancedField.maxFeePerGas]: string
  [AdvancedField.maxPriorityFeePerGas]: string
}

const AdvancedParamsForm = ({ params, ...props }: AdvancedParamsFormProps) => {
  const formMethods = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      userNonce: params.userNonce ?? 0,
      gasLimit: params.gasLimit?.toString() || undefined,
      maxFeePerGas: params.maxFeePerGas ? safeFormatUnits(params.maxFeePerGas) : '',
      maxPriorityFeePerGas: params.maxPriorityFeePerGas ? safeFormatUnits(params.maxPriorityFeePerGas) : '',
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = formMethods

  const onBack = () => {
    props.onSubmit({
      userNonce: params.userNonce,
      gasLimit: params.gasLimit,
      maxFeePerGas: params.maxFeePerGas,
      maxPriorityFeePerGas: params.maxPriorityFeePerGas,
    })
  }

  const onSubmit = (data: FormData) => {
    props.onSubmit({
      userNonce: data.userNonce,
      gasLimit: data.gasLimit ? BigInt(data.gasLimit) : undefined,
      maxFeePerGas: safeParseUnits(data.maxFeePerGas) ?? params.maxFeePerGas,
      maxPriorityFeePerGas: safeParseUnits(data.maxPriorityFeePerGas) ?? params.maxPriorityFeePerGas,
    })
  }

  const onFormSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSubmit(onSubmit)()
  }

  return (
    <FormProvider {...formMethods}>
      <AdvancedParamsFormView
        onFormSubmit={onFormSubmit}
        onBack={onBack}
        willRelay={props.willRelay}
        isEIP1559={props.isEIP1559}
        errors={errors}
        userNonceField={register(AdvancedField.userNonce)}
        gasLimitInput={<GasLimitInput recommendedGasLimit={props.recommendedGasLimit?.toString()} />}
        maxPriorityFeePerGasField={
          props.isEIP1559
            ? register(AdvancedField.maxPriorityFeePerGas, {
                required: true,
                pattern: FLOAT_REGEX,
                min: 0,
              })
            : undefined
        }
        maxFeePerGasField={register(AdvancedField.maxFeePerGas, { required: true, pattern: FLOAT_REGEX, min: 0 })}
      />
    </FormProvider>
  )
}

export default AdvancedParamsForm
