import EthHashInfo from '@/components/common/EthHashInfo'
import NameInput from '@/components/common/NameInput'
import { useAppDispatch } from '@/store'
import { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { EditOwnerDialogView } from '@views/components/settings/owner/EditOwnerDialog/EditOwnerDialogView'

type EditOwnerValues = {
  name: string
}

export const EditOwnerDialog = ({ chainId, address, name }: { chainId: string; address: string; name?: string }) => {
  const [open, setOpen] = useState(false)

  const dispatch = useAppDispatch()

  const handleClose = () => setOpen(false)

  const onSubmit = (data: EditOwnerValues) => {
    if (data.name !== name) {
      dispatch(
        upsertAddressBookEntries({
          chainIds: [chainId],
          address,
          name: data.name,
        }),
      )
      handleClose()
    }
  }

  const formMethods = useForm<EditOwnerValues>({
    defaultValues: {
      name: name || '',
    },
    mode: 'onChange',
  })

  const { handleSubmit, formState, watch } = formMethods

  const nameValue = watch('name')

  const buttonDisabled = !formState.isValid || nameValue === name || nameValue === ''

  return (
    <FormProvider {...formMethods}>
      <EditOwnerDialogView
        open={open}
        onOpen={() => setOpen(true)}
        onClose={handleClose}
        onSubmit={handleSubmit(onSubmit)}
        buttonDisabled={buttonDisabled}
        renderNameInput={(props) => <NameInput {...props} />}
        addressInfo={<EthHashInfo address={address} showCopyButton shortAddress={false} />}
      />
    </FormProvider>
  )
}
