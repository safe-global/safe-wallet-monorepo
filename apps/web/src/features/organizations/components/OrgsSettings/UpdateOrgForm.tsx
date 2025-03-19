import { Alert, Button, TextField } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { showNotification } from '@/store/notificationsSlice'
import {
  type GetOrganizationResponse,
  useOrganizationsUpdateV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useAppDispatch } from '@/store'
import { useIsAdmin } from '@/features/organizations/hooks/useOrgMembers'
import { useState } from 'react'

type UpdateOrganizationFormData = {
  name: string
}

const UpdateOrgForm = ({ org }: { org: GetOrganizationResponse | undefined }) => {
  const [error, setError] = useState<string>()
  const dispatch = useAppDispatch()
  const [updateOrg] = useOrganizationsUpdateV1Mutation()
  const isAdmin = useIsAdmin(org?.id)

  const formMethods = useForm<UpdateOrganizationFormData>({
    mode: 'onChange',
    values: {
      name: org?.name || '',
    },
  })

  const { register, handleSubmit, watch } = formMethods

  const formName = watch('name')
  const isNameChanged = formName !== org?.name

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    if (!org) return

    try {
      await updateOrg({ id: org.id, updateOrganizationDto: { name: data.name } })

      dispatch(
        showNotification({
          variant: 'success',
          message: 'Successfully updated organization name',
          groupKey: 'org-update-name',
        }),
      )
    } catch (e) {
      console.error(e)
      setError('Error updating the organization. Please try again.')
    }
  })

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={onSubmit}>
        <TextField
          {...register('name')}
          label="Organization name"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          onKeyDown={(e) => e.stopPropagation()}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button variant="contained" type="submit" sx={{ mt: 2 }} disabled={!isNameChanged || !isAdmin}>
          Save
        </Button>
      </form>
    </FormProvider>
  )
}

export default UpdateOrgForm
