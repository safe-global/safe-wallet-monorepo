import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useUpdateSpace, type UpdateSpaceFormData } from './useUpdateSpace'
import ErrorAlert from './ErrorAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin } from '@/features/spaces'

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
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="space-name">Workspace name</Label>
              <Input {...field} id="space-name" value={field.value || ''} onKeyDown={(e) => e.stopPropagation()} />
            </div>
          )}
        />

        <ErrorAlert error={error} />

        <Button data-testid="space-save-button" type="submit" className="mt-4" disabled={!canSubmit}>
          Save
        </Button>
      </form>
    </FormProvider>
  )
}

export default UpdateSpaceForm
