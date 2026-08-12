import AddressInput from '@/components/common/AddressInput'
import ChainIndicator from '@/components/common/ChainIndicator'
import ModalDialog from '@/components/common/ModalDialog'
import chains from '@safe-global/utils/config/chains'
import css from './styles.module.css'
import useChains from '@/hooks/useChains'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'

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
    trackEvent({ ...SPACE_EVENTS.ADD_ACCOUNT_MANUALLY })
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
    <>
      <Button
        type="button"
        data-testid="add-manually-button"
        variant="secondary"
        size="lg"
        disabled={disabled}
        onClick={() => setAddManuallyOpen(true)}
        className="w-full"
      >
        <Plus className="size-4" />
        Add manually
      </Button>
      <ModalDialog
        open={addManuallyOpen}
        dialogTitle="Add safe account"
        onClose={onClose}
        hideChainIndicator
        PaperProps={{ sx: { maxWidth: '760px' } }}
      >
        <FormProvider {...formMethods}>
          <form
            onSubmit={(e) => {
              e.stopPropagation()
              return onSubmit(e)
            }}
          >
            <div className="px-6 py-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <AddressInput
                  data-testid="add-address-input"
                  label="Safe account"
                  chain={selectedChain}
                  validate={validateSafeAddress}
                  name="address"
                  deps={chainId}
                />
                <div data-testid="network-selector" className={css.selectWrapper}>
                  <Select
                    value={chainId}
                    onValueChange={(value) => {
                      if (value) setValue('chainId', value, { shouldValidate: true })
                    }}
                  >
                    {/* eslint-disable-next-line no-restricted-syntax -- h-full/w-full fill the row cell (layout); skin is variant="ghost" */}
                    <SelectTrigger variant="ghost" className="h-full w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configs.map((chain) => (
                        <SelectItem data-testid="network-item" key={chain.chainId} value={chain.chainId}>
                          <ChainIndicator chainId={chain.chainId} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button data-testid="add-space-account-manually-button" disabled={!formState.isValid} type="submit">
                Add
              </Button>
            </div>
          </form>
        </FormProvider>
      </ModalDialog>
    </>
  )
}

export default AddManually
