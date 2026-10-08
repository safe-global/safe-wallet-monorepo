import AddressInput from '@/components/common/AddressInput'
import chains from '@safe-global/utils/config/chains'
import useChains from '@/hooks/useChains'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { trackEvent } from '@/services/analytics'
import { AddManuallyView } from '@views/features/spaces/components/AddAccounts/AddManuallyView'

export type AddManuallyFormValues = {
  address: string
  chainId: string
}

const AddManually = ({
  handleAddSafe,
  disabled = false,
}: {
  handleAddSafe: (data: AddManuallyFormValues) => void
  disabled?: boolean
}) => {
  const [addManuallyOpen, setAddManuallyOpen] = useState(false)
  const { configs } = useChains()
  const [triggerGetSafe] = useLazySafesGetSafeV1Query()

  const formMethods = useForm<AddManuallyFormValues>({
    mode: 'onChange',
    defaultValues: {
      address: '',
      chainId: chains.eth,
    },
  })

  const { handleSubmit, watch, setValue, reset, formState } = formMethods

  const chainId = watch('chainId')
  const selectedChain = configs.find((chain) => chain.chainId === chainId)

  const onSubmit = handleSubmit((data) => {
    trackEvent(SPACE_EVENTS.ADD_ACCOUNT_MANUALLY, { [MixpanelEventParams.CHAIN_ID]: data.chainId })
    handleAddSafe(data)
    onClose()
  })

  const onClose = () => {
    reset()
    setAddManuallyOpen(false)
  }

  const validateSafeAddress = async (address: string) => {
    try {
      const result = await triggerGetSafe({ chainId, safeAddress: address }).unwrap()
      if (!result) {
        return 'Address given is not a valid Safe account address'
      }
    } catch (error) {
      return 'Address given is not a valid Safe account address'
    }
  }

  return (
    <FormProvider {...formMethods}>
      <AddManuallyView
        disabled={disabled}
        open={addManuallyOpen}
        onOpen={() => setAddManuallyOpen(true)}
        onClose={onClose}
        onSubmit={(e) => {
          e.stopPropagation()
          return onSubmit(e)
        }}
        isValid={formState.isValid}
        chainId={chainId}
        chainIds={configs.map((chain) => chain.chainId)}
        onChainChange={(value) => {
          if (value) setValue('chainId', value, { shouldValidate: true })
        }}
        renderAddressInput={(props) => (
          <AddressInput {...props} chain={selectedChain} validate={validateSafeAddress} name="address" deps={chainId} />
        )}
      />
    </FormProvider>
  )
}

export default AddManually
