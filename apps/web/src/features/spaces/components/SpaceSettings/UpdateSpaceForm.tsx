import { FormProvider, useForm } from 'react-hook-form'
import { useUpdateSpace, type UpdateSpaceFormData } from './useUpdateSpace'
import ErrorAlert from './ErrorAlert'
import { Button } from '@mui/material'
import { type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin } from '@/features/spaces'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'
import NameInput from '@/components/common/NameInput'
import { NAME_MIN_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'

const UpdateSpaceForm = ({ space, onClose }: { space: GetSpaceResponse | undefined; onClose?: () => void }) => {
  const { handleUpdate, error } = useUpdateSpace(space, onClose)
  const isAdmin = useIsAdmin(space?.uuid)

  const formMethods = useForm<UpdateSpaceFormData>({
    mode: 'onChange',
    values: {
      name: space?.name || '',
    },
  })

  const { handleSubmit, watch, formState } = formMethods

  const formName = watch('name')
  const isNameChanged = sanitizeName(formName ?? '') !== (space?.name ?? '')
  const hasNameError = Boolean(formState.errors.name)
  const canSubmit = isNameChanged && isAdmin && !hasNameError && !formState.isSubmitting

  const onSubmit = handleSubmit(handleUpdate)

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={onSubmit}>
        <NameInput
          name="name"
          label="Workspace name"
          required
          validateCharset
          minLength={NAME_MIN_LENGTH}
          maxLength={SPACE_NAME_MAX_LENGTH}
        />

        <ErrorAlert error={error} />

        <Button data-testid="space-save-button" variant="contained" type="submit" sx={{ mt: 2 }} disabled={!canSubmit}>
          Save
        </Button>
      </form>
    </FormProvider>
  )
}

export default UpdateSpaceForm
