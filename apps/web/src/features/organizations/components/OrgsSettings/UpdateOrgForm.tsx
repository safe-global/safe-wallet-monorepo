import { Button, TextField } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { showNotification } from '@/store/notificationsSlice'
import {
  type GetOrganizationResponse,
  useOrganizationsUpdateV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useAppDispatch } from '@/store'
import { useIsAdmin } from '@/features/organizations/hooks/useOrgMembers'

type UpdateOrganizationFormData = {
  name: string
}

const UpdateOrgForm = ({ org }: { org: GetOrganizationResponse | undefined }) => {
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
      console.log(e)
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
        />

        <Button variant="contained" type="submit" sx={{ mt: 2 }} disabled={!isNameChanged || !isAdmin}>
          Save
        </Button>
      </form>
    </FormProvider>
  )
}

export default UpdateOrgForm
