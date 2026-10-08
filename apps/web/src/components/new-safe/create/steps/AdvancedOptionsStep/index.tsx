import { predictAddressBasedOnReplayData } from '@/features/multichain'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { type ReactElement, useMemo } from 'react'

import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import { type SafeVersion } from '@safe-global/types-kit'
import { useCurrentChain } from '@/hooks/useChains'
import { validateAddress } from '@safe-global/utils/utils/validation'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { createNewUndeployedSafeWithoutSalt } from '../../logic'
import EthHashInfo from '@/components/common/EthHashInfo'
import NumberField from '@/components/common/NumberField'
import { isSmartContract } from '@/utils/wallets'
import { AdvancedOptionsStepView } from '@views/components/new-safe/create/steps/AdvancedOptionsStep/AdvancedOptionsStepView'

enum AdvancedOptionsFields {
  safeVersion = 'safeVersion',
  saltNonce = 'saltNonce',
  paymentReceiver = 'paymentReceiver',
}

export type AdvancedOptionsStepForm = {
  [AdvancedOptionsFields.safeVersion]: SafeVersion
  [AdvancedOptionsFields.saltNonce]: number
  [AdvancedOptionsFields.paymentReceiver]: string
}

const ADVANCED_OPTIONS_STEP_FORM_ID = 'create-safe-advanced-options-step-form'

const AdvancedOptionsStep = ({ onSubmit, onBack, data, setStep }: StepRenderProps<NewSafeFormData>): ReactElement => {
  useSyncSafeCreationStep(setStep, data.networks)
  const chain = useCurrentChain()
  const provider = useWeb3ReadOnly()

  const formMethods = useForm<AdvancedOptionsStepForm>({
    mode: 'onChange',
    defaultValues: data,
  })

  const { handleSubmit, control, watch, formState, getValues, register } = formMethods

  const selectedSafeVersion = watch(AdvancedOptionsFields.safeVersion)
  const selectedSaltNonce = watch(AdvancedOptionsFields.saltNonce)
  const selectedPaymentReceiver = watch(AdvancedOptionsFields.paymentReceiver)

  const newSafeProps = useMemo(
    () =>
      chain
        ? createNewUndeployedSafeWithoutSalt(
            selectedSafeVersion,
            {
              owners: data.owners.map((owner) => owner.address),
              threshold: data.threshold,
              paymentReceiver: selectedPaymentReceiver,
            },
            chain,
          )
        : undefined,
    [chain, data.owners, data.threshold, selectedSafeVersion, selectedPaymentReceiver],
  )

  const [predictedSafeAddress] = useAsync(async () => {
    if (!provider || !newSafeProps) return

    const replayedSafeWithNonce = { ...newSafeProps, saltNonce: selectedSaltNonce.toString() }

    return predictAddressBasedOnReplayData(replayedSafeWithNonce, provider)
  }, [provider, newSafeProps, selectedSaltNonce])

  const [isDeployed] = useAsync(
    async () => (predictedSafeAddress ? await isSmartContract(predictedSafeAddress) : false),
    [predictedSafeAddress],
  )

  const isDisabled = !formState.isValid || Boolean(isDeployed)

  const handleBack = () => {
    const formData = getValues()
    onBack(formData)
  }

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data)

    // TODO: Tracking of advanced setup
  })

  return (
    <FormProvider {...formMethods}>
      <AdvancedOptionsStepView
        formId={ADVANCED_OPTIONS_STEP_FORM_ID}
        onSubmit={onFormSubmit}
        onBack={handleBack}
        isDisabled={isDisabled}
        isDeployed={Boolean(isDeployed)}
        renderSafeVersionController={(render) => (
          <Controller control={control} name="safeVersion" render={({ field }) => render(field)} />
        )}
        renderPaymentReceiverController={(render) => (
          <Controller
            control={control}
            name={AdvancedOptionsFields.paymentReceiver}
            // A format check keeps a garbage receiver from leaving the address prediction spinning forever
            rules={{ required: 'Payment receiver is required', validate: validateAddress }}
            render={({ field, fieldState }) => render(field, fieldState)}
          />
        )}
        saltNonceRegistration={register(AdvancedOptionsFields.saltNonce, {
          validate: async (value) => {
            if (isNaN(value)) {
              return 'Salt nonce must be a number'
            }
            if (value < 0) {
              return 'Salt nonce must be positive'
            }
          },
          required: 'Salt nonce is required',
        })}
        renderSaltNonceField={(props) => <NumberField {...props} />}
        hasSaltNonceError={Boolean(formState.errors[AdvancedOptionsFields.saltNonce])}
        saltNonceErrorMessage={formState.errors[AdvancedOptionsFields.saltNonce]?.message}
        predictedSafeAddressInfo={
          predictedSafeAddress ? <EthHashInfo address={predictedSafeAddress} hasExplorer showCopyButton /> : undefined
        }
      />
    </FormProvider>
  )
}

export default AdvancedOptionsStep
