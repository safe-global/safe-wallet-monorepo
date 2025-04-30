import { type SyntheticEvent } from 'react'
import { Button, DialogActions, FormControl, Grid, Typography, DialogContent } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { FLOAT_REGEX } from '@safe-global/utils/utils/validation'
import ModalDialog from '@/components/common/ModalDialog'
import { AdvancedField, type AdvancedParameters } from './types'
import GasLimitInput from './GasLimitInput'
import ExternalLink from '@/components/common/ExternalLink'
import NumberField from '@/components/common/NumberField'

import { HelpCenterArticle } from '@safe-global/utils/config/constants'

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
    <ModalDialog open dialogTitle="Advanced parameters" hideChainIndicator>
      <FormProvider {...formMethods}>
        <form onSubmit={onFormSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" fontWeight={700}>
                  Execution parameters
                </Typography>
              </Grid>

              {/* User nonce */}
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <NumberField
                    disabled={props.willRelay}
                    label={errors.userNonce?.message || 'Wallet nonce'}
                    error={!!errors.userNonce}
                    {...register(AdvancedField.userNonce)}
                  />
                </FormControl>
              </Grid>

              {/* Gas limit */}
              <Grid item xs={6}>
                <GasLimitInput recommendedGasLimit={props.recommendedGasLimit?.toString()} />
              </Grid>

              {/* Gas price */}
              {props.isEIP1559 && (
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <NumberField
                      disabled={props.willRelay}
                      label={errors.maxPriorityFeePerGas?.message || 'Max priority fee (Gwei)'}
                      error={!!errors.maxPriorityFeePerGas}
                      required
                      {...register(AdvancedField.maxPriorityFeePerGas, {
                        required: true,
                        pattern: FLOAT_REGEX,
                        min: 0,
                      })}
                    />
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <NumberField
                    disabled={props.willRelay}
                    label={errors.maxFeePerGas?.message || props.isEIP1559 ? 'Max fee (Gwei)' : 'Gas price (Gwei)'}
                    error={!!errors.maxFeePerGas}
                    required
                    {...register(AdvancedField.maxFeePerGas, { required: true, pattern: FLOAT_REGEX, min: 0 })}
                  />
                </FormControl>
              </Grid>
            </Grid>

            {/* Help link */}
            <Typography mt={2}>
              <ExternalLink href={HelpCenterArticle.ADVANCED_PARAMS}>
                How can I configure these parameters manually?
              </ExternalLink>
            </Typography>
          </DialogContent>

          {/* Buttons */}
          <DialogActions>
            <Button color="inherit" onClick={onBack}>
              Back
            </Button>

            <Button variant="contained" type="submit">
              Confirm
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default AdvancedParamsForm
