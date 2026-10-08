import { FormProvider, useForm } from 'react-hook-form'
import AddressBookInput from '@/components/common/AddressBookInput'
import type { NftTransferParams } from '.'
import { useContext, useMemo } from 'react'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import { useSafeShieldForRecipients } from '@/features/safe-shield/SafeShieldContext'
import { NftItems, SendNftBatchView } from '@views/components/tx-flow/flows/NftTransfer/SendNftBatchView'

enum Field {
  recipient = 'recipient',
}

type FormData = Pick<NftTransferParams, Field.recipient>

export { NftItems }

const SendNftBatch = () => {
  const { data, onNext } = useContext<TxFlowContextType<NftTransferParams>>(TxFlowContext)
  const { tokens = [] } = data || {}

  const formMethods = useForm<FormData>({
    defaultValues: {
      [Field.recipient]: data?.recipient,
    },
  })
  const {
    handleSubmit,
    watch,
    formState: { errors },
  } = formMethods

  const recipient = watch(Field.recipient)
  const isAddressValid = !!recipient && !errors[Field.recipient]

  const recipientArray = useMemo(() => [recipient], [recipient])
  useSafeShieldForRecipients(recipientArray)

  const onFormSubmit = (data: FormData) => {
    onNext({
      recipient: data.recipient,
      tokens,
    })
  }

  return (
    <FormProvider {...formMethods}>
      <SendNftBatchView
        onSubmit={handleSubmit(onFormSubmit)}
        recipientInput={<AddressBookInput name={Field.recipient} canAdd={isAddressValid} />}
        tokens={tokens}
      />
    </FormProvider>
  )
}

export default SendNftBatch
