import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useUpdateSpace, type UpdateSpaceFormData } from './useUpdateSpace'
import ErrorAlert from './ErrorAlert'
import { Button, TextField } from '@mui/material'
import { type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin } from '@/features/spaces'

const UpdateSpaceForm = ({ space }: { space: GetSpaceResponse | undefined }) => {
  const { handleUpdate, error } = useUpdateSpace(space)
  const isAdmin = useIsAdmin(space?.id)

  const formMethods = useForm<UpdateSpaceFormData>({
    mode: 'onChange',
    values: {
      name: space?.name || '',
    },
  })

  const { control, handleSubmit, watch, formState } = formMethods

  const formName = watch('name')
  const isNameChanged = formName !== space?.name
  const canSubmit = isNameChanged && isAdmin && !formState.isSubmitting

  const onSubmit = handleSubmit(handleUpdate)

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={onSubmit}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Space name"
              fullWidth
              value={field.value || ''}
              slotProps={{ inputLabel: { shrink: true } }}
              onKeyDown={(e) => e.stopPropagation()}
            />
          )}
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
