import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useUpdateSpace, type UpdateSpaceFormData } from './useUpdateSpace'
import ErrorAlert from './ErrorAlert'
import { Button, TextField } from '@mui/material'
import { type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin } from '@/features/spaces'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'
import { NAME_MIN_LENGTH, sanitizeName, validateName } from '@safe-global/utils/validation/names'

const UpdateSpaceForm = ({ space }: { space: GetSpaceResponse | undefined }) => {
  const { handleUpdate, error } = useUpdateSpace(space)
  const isAdmin = useIsAdmin(space?.uuid)

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
          rules={{
            validate: (value) => {
              const sanitized = sanitizeName(value ?? '')
              if (sanitized === '') return 'Required'
              return validateName(sanitized, { minLength: NAME_MIN_LENGTH, maxLength: SPACE_NAME_MAX_LENGTH }) ?? true
            },
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Workspace name"
              fullWidth
              value={field.value || ''}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: SPACE_NAME_MAX_LENGTH } }}
              onBlur={() => field.onChange(sanitizeName(field.value ?? ''))}
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
