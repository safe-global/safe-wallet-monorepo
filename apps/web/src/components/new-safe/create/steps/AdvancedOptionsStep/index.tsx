import { predictAddressBasedOnReplayData } from '@/features/multichain'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { type ReactElement, useMemo } from 'react'

import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import { ArrowLeft as ArrowBackIcon } from 'lucide-react'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { type SafeVersion } from '@safe-global/types-kit'
import NumberField from '@/components/common/NumberField'
import { useCurrentChain } from '@/hooks/useChains'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { createNewUndeployedSafeWithoutSalt } from '../../logic'
import EthHashInfo from '@/components/common/EthHashInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import { isSmartContract } from '@/utils/wallets'

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
    <form data-testid="advanced-options-step-form" onSubmit={onFormSubmit} id={ADVANCED_OPTIONS_STEP_FORM_ID}>
      <FormProvider {...formMethods}>
        <div className="flex flex-col gap-4">
          <div className={layoutCss.row}>
            <Typography variant="h4" className="inline-flex items-center gap-2">
              Safe version
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="flex text-[var(--color-border-main)]">
                      <InfoIcon className="size-4" />
                    </span>
                  }
                />
                <TooltipContent>
                  The threshold of a Safe account specifies how many signers need to confirm a Safe account transaction
                  before it can be executed.
                </TooltipContent>
              </Tooltip>
            </Typography>
            <Typography variant="paragraph-small" className="mb-4 block">
              Changes the used master copy and fallback handler of the Safe.
            </Typography>
            <Controller
              control={control}
              name="safeVersion"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="advanced-safe-version">Safe version</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="advanced-safe-version" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.4.1">1.4.1 (latest)</SelectItem>
                      <SelectItem value="1.3.0">1.3.0</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Typography variant="h4" className="mt-8 inline-flex w-full items-center gap-2">
              Salt nonce
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="flex text-[var(--color-border-main)]">
                      <InfoIcon className="size-4" />
                    </span>
                  }
                />
                <TooltipContent>
                  The salt nonce changes the predicted Safe address. It can be used to re-create a Safe from another
                  chain or to create a specific Safe address
                </TooltipContent>
              </Tooltip>
            </Typography>
            <Typography variant="paragraph-small" className="mb-4 block">
              Impacts the derived Safe address
            </Typography>
            <NumberField
              {...register(AdvancedOptionsFields.saltNonce, {
                validate: async (value) => {
                  if (isNaN(value)) {
                    return 'Salt nonce must be a number'
                  }
                  if (value < 0) {
                    return 'Salt nonce must be positive'
                  }
                },
                required: true,
              })}
              fullWidth
              label="Salt nonce"
              error={Boolean(formState.errors[AdvancedOptionsFields.saltNonce]) || Boolean(isDeployed)}
              helperText={
                formState.errors[AdvancedOptionsFields.saltNonce]?.message ??
                (Boolean(isDeployed) ? 'The Safe is already deployed. Use a different salt nonce.' : undefined)
              }
            />

            <Typography variant="h4" className="mt-8 inline-flex w-full items-center gap-2">
              Payment receiver
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="flex text-[var(--color-border-main)]">
                      <InfoIcon className="size-4" />
                    </span>
                  }
                />
                <TooltipContent>The payment receiver changes the predicted Safe address.</TooltipContent>
              </Tooltip>
            </Typography>
            <Typography variant="paragraph-small" className="mb-4 block">
              Impacts the derived Safe address
            </Typography>
            <Controller
              control={control}
              name={AdvancedOptionsFields.paymentReceiver}
              rules={{ required: true }}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="advanced-payment-receiver">Payment receiver</FieldLabel>
                  <Input
                    id="advanced-payment-receiver"
                    name={field.name}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={
                      formState.errors[AdvancedOptionsFields.paymentReceiver]?.message ??
                      (Boolean(isDeployed)
                        ? 'The Safe is already deployed. Use a different payment receiver.'
                        : undefined)
                    }
                  />
                </Field>
              )}
            />
          </div>

          <Separator />

          <div className={layoutCss.row}>
            <Typography variant="h4" className="mb-2">
              New Safe address
            </Typography>
            {predictedSafeAddress ? (
              <EthHashInfo address={predictedSafeAddress} hasExplorer showCopyButton />
            ) : (
              <Skeleton className="h-5 w-full" />
            )}
          </div>

          <Separator />

          <div className={layoutCss.row}>
            <div className="flex flex-row justify-between gap-6">
              <Button data-testid="back-btn" variant="outline" size="lg" onClick={handleBack}>
                <ArrowBackIcon className="size-4" />
                Back
              </Button>
              <Button data-testid="next-btn" type="submit" variant="default" size="lg" disabled={isDisabled}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </FormProvider>
    </form>
  )
}

export default AdvancedOptionsStep
