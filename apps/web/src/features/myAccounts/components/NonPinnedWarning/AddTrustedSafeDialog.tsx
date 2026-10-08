import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import NameInput from '@/components/common/NameInput'
import type { SimilarAddressInfo } from '../../hooks/useNonPinnedSafeWarning.types'
import { AddTrustedSafeDialogView } from '@views/features/myAccounts/components/NonPinnedWarning/AddTrustedSafeDialogView'

interface AddTrustedSafeDialogProps {
  open: boolean
  safeAddress: string
  safeName?: string
  chainId: string
  hasSimilarAddress: boolean
  similarAddresses: SimilarAddressInfo[]
  onConfirm: (name: string) => void
  onCancel: () => void
}

interface FormData {
  name: string
}

/**
 * Confirmation dialog for adding a safe to the trusted list
 * Shows enhanced warning if similar addresses are detected
 */
const AddTrustedSafeDialog = ({
  open,
  safeAddress,
  safeName,
  hasSimilarAddress,
  similarAddresses,
  onConfirm,
  onCancel,
}: AddTrustedSafeDialogProps) => {
  const methods = useForm<FormData>({
    defaultValues: {
      name: safeName || '',
    },
    mode: 'onChange',
  })

  const { handleSubmit, formState, reset } = methods

  // Reset form when the target Safe changes so stale names aren't submitted
  useEffect(() => {
    reset({ name: safeName || '' })
  }, [safeName, safeAddress, reset])

  const onSubmit = handleSubmit((data: FormData) => {
    onConfirm(data.name.trim() || '')
  })

  return (
    <FormProvider {...methods}>
      <AddTrustedSafeDialogView
        open={open}
        safeAddress={safeAddress}
        hasSimilarAddress={hasSimilarAddress}
        similarAddresses={similarAddresses}
        isValid={formState.isValid}
        onSubmit={onSubmit}
        onCancel={onCancel}
        renderNameInput={(props) => <NameInput {...props} />}
      />
    </FormProvider>
  )
}

export default AddTrustedSafeDialog
