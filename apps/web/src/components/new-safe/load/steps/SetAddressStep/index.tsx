import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import NameInput from '@/components/common/NameInput'
import InfoIcon from '@/public/images/notifications/info.svg'
import NetworkSelector from '@/components/common/NetworkSelector'
import { useMnemonicSafeName } from '@/hooks/useMnemonicName'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import AddressInput from '@/components/common/AddressInput'
import { largeFormFieldSurfaceClassName, largeFormInputGroupClassName } from '@/components/common/formFieldStyles'
import React from 'react'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useChainId from '@/hooks/useChainId'
import { useAppSelector } from '@/store'
import { selectAddedSafes } from '@/store/addedSafesSlice'
import { LOAD_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import NextLink from 'next/link'

enum Field {
  name = 'name',
  address = 'address',
}

type FormData = {
  [Field.name]: string
  [Field.address]: string
}

const nameInputGroupClassName = largeFormInputGroupClassName

const networkSelectTriggerClassName = `${largeFormFieldSurfaceClassName} w-full`

const SetAddressStep = ({ data, onSubmit, onBack }: StepRenderProps<LoadSafeFormData>) => {
  const currentChainId = useChainId()
  const addedSafes = useAppSelector((state) => selectAddedSafes(state, currentChainId))
  const [triggerGetSafe] = useLazySafesGetSafeV1Query()
  const formMethods = useForm<FormData>({
    mode: 'all',
    defaultValues: {
      [Field.name]: data.name,
      [Field.address]: data.address,
    },
  })

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    getValues,
  } = formMethods

  const safeAddress = watch(Field.address)
  const randomName = useMnemonicSafeName()
  const { ens, name, resolving } = useAddressResolver(safeAddress)

  // Address book, ENS, mnemonic
  const fallbackName = name || ens || randomName

  const validateSafeAddress = async (address: string) => {
    if (addedSafes && Object.keys(addedSafes).includes(address)) {
      return 'Safe account is already added'
    }

    try {
      const result = await triggerGetSafe({ chainId: currentChainId, safeAddress: address }).unwrap()
      if (!result) {
        return 'Address given is not a valid Safe account address'
      }
    } catch (error) {
      return 'Address given is not a valid Safe account address'
    }
  }

  const onFormSubmit = handleSubmit((data: FormData) => {
    onSubmit({
      ...data,
      [Field.name]: data[Field.name] || fallbackName,
    })

    if (data[Field.name]) {
      trackEvent(LOAD_SAFE_EVENTS.NAME_SAFE)
    }
  })

  const handleBack = () => {
    const formData = getValues()
    onBack({
      ...formData,
      [Field.name]: formData.name || fallbackName,
    })
  }

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={onFormSubmit}>
        <div className={layoutCss.row}>
          <div className="mb-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
              <div className="order-last md:order-first">
                <NameInput
                  name={Field.name}
                  label={errors?.[Field.name]?.message || 'Name'}
                  placeholder={fallbackName}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    className: nameInputGroupClassName,
                    endAdornment: resolving ? (
                      <div className="flex items-center">
                        <Spinner className="size-5" />
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="flex items-center">
                              <InfoIcon className="size-5" />
                            </span>
                          }
                        />
                        <TooltipContent>
                          This name is stored locally and will never be shared with us or any third parties.
                        </TooltipContent>
                      </Tooltip>
                    ),
                  }}
                />
              </div>
              <div className="order-first w-full md:order-last md:w-[220px]">
                <NetworkSelector triggerClassName={networkSelectTriggerClassName} />
              </div>
            </div>

            <AddressInput
              data-testid="address-section"
              label="Safe account"
              validate={validateSafeAddress}
              name={Field.address}
            />
          </div>

          <Typography className="mt-8 block">
            By continuing you consent to the <Link render={<NextLink href={AppRoutes.terms} />}>terms of use</Link> and{' '}
            <Link render={<NextLink href={AppRoutes.privacy} />}>privacy policy</Link>.
          </Typography>
        </div>

        <Separator />

        <div className={layoutCss.row}>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="lg" onClick={handleBack}>
              Back
            </Button>
            <Button data-testid="load-safe-next-btn" type="submit" size="lg" disabled={!isValid}>
              Next
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

export default SetAddressStep
