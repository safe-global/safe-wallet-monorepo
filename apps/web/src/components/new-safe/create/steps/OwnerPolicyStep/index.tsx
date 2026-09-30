import useAddressBook from '@/hooks/useAddressBook'
import useWallet from '@/hooks/wallets/useWallet'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { NamedAddress } from '@/components/new-safe/create/types'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
import type { CreateSafeInfoItem } from '@/components/new-safe/create/CreateSafeInfos'
import { useSafeSetupHints } from '@/components/new-safe/create/steps/OwnerPolicyStep/useSafeSetupHints'
import useSyncSafeCreationStep from '@/components/new-safe/create/useSyncSafeCreationStep'
import { ArrowLeft as ArrowBackIcon } from 'lucide-react'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import OwnerRow from '@/components/new-safe/OwnerRow'
import { maybePlural } from '@safe-global/utils/utils/formatters'

enum OwnerPolicyStepFields {
  owners = 'owners',
  threshold = 'threshold',
}

export type OwnerPolicyStepForm = {
  [OwnerPolicyStepFields.owners]: NamedAddress[]
  [OwnerPolicyStepFields.threshold]: number
}

const OWNER_POLICY_STEP_FORM_ID = 'create-safe-owner-policy-step-form'

const OwnerPolicyStep = ({
  onSubmit,
  onBack,
  data,
  setStep,
  setDynamicHint,
}: StepRenderProps<NewSafeFormData> & {
  setDynamicHint: (hints: CreateSafeInfoItem | undefined) => void
}): ReactElement => {
  const wallet = useWallet()
  const addressBook = useAddressBook()
  const defaultOwnerAddressBookName = wallet?.address ? addressBook[wallet.address] : undefined
  const defaultOwner: NamedAddress = {
    name: defaultOwnerAddressBookName || wallet?.ens || '',
    address: wallet?.address || '',
  }
  useSyncSafeCreationStep(setStep, data.networks)

  const formMethods = useForm<OwnerPolicyStepForm>({
    mode: 'onChange',
    defaultValues: {
      [OwnerPolicyStepFields.owners]: data.owners.length > 0 ? data.owners : [defaultOwner],
      [OwnerPolicyStepFields.threshold]: data.threshold,
    },
  })

  const { handleSubmit, control, watch, formState, getValues, setValue, trigger } = formMethods

  const threshold = watch(OwnerPolicyStepFields.threshold)

  const {
    fields: ownerFields,
    append: appendOwner,
    remove,
  } = useFieldArray({ control, name: OwnerPolicyStepFields.owners })

  const removeOwner = (index: number): void => {
    // Set threshold if it's greater than the number of owners
    setValue(OwnerPolicyStepFields.threshold, Math.min(threshold, ownerFields.length - 1))
    remove(index)
    trigger(OwnerPolicyStepFields.owners)
  }

  const isDisabled = !formState.isValid

  useSafeSetupHints(setDynamicHint, threshold, ownerFields.length)

  const handleBack = () => {
    const formData = getValues()
    onBack({ ...data, ...formData })
  }

  const onFormSubmit = handleSubmit((data) => {
    onSubmit(data)

    trackEvent({
      ...CREATE_SAFE_EVENTS.OWNERS,
      label: data.owners.length,
    })

    trackEvent({
      ...CREATE_SAFE_EVENTS.THRESHOLD,
      label: data.threshold,
    })
  })

  return (
    <form data-testid="owner-policy-step-form" onSubmit={onFormSubmit} id={OWNER_POLICY_STEP_FORM_ID}>
      <FormProvider {...formMethods}>
        <div className={layoutCss.row}>
          {ownerFields.map((field, i) => (
            <OwnerRow
              key={field.id}
              index={i}
              removable={i > 0}
              groupName={OwnerPolicyStepFields.owners}
              remove={removeOwner}
            />
          ))}
          <Button
            data-testid="add-new-signer"
            variant="ghost"
            onClick={() => appendOwner({ name: '', address: '' }, { shouldFocus: true })}
            size="lg"
          >
            <AddIcon className="size-4" />
            Add new signer
          </Button>
        </div>

        <Separator />
        <div className={layoutCss.row}>
          <Typography variant="h4" className="inline-flex items-center gap-2">
            Threshold
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
            Any transaction requires the confirmation of:
          </Typography>
          <div className="flex flex-row items-center gap-4 pt-2">
            <div>
              <Controller
                control={control}
                name="threshold"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="threshold-selector">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ownerFields.map((_, idx) => (
                        <SelectItem data-testid="threshold-item" key={idx + 1} value={idx + 1}>
                          {idx + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Typography>
                out of {ownerFields.length} signer{maybePlural(ownerFields)}
              </Typography>
            </div>
          </div>
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
      </FormProvider>
    </form>
  )
}

export default OwnerPolicyStep
