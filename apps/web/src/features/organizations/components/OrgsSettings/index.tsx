import { Button, Card, Grid2, TextField, Typography } from '@mui/material'
import {
  useOrganizationsGetOneV1Query,
  useOrganizationsUpdateV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useRouter } from 'next/router'
import { FormProvider, useForm } from 'react-hook-form'

type OrganizationFormData = {
  name: string
}

const OrgsSettings = () => {
  const router = useRouter()
  const orgId = Array.isArray(router.query.orgId) ? router.query.orgId[0] : router.query.orgId
  const { data: org } = useOrganizationsGetOneV1Query({ id: Number(orgId) })
  const [updateOrg] = useOrganizationsUpdateV1Mutation()

  const formMethods = useForm<OrganizationFormData>({
    mode: 'onChange',
    values: {
      name: org?.name || '',
    },
  })

  const { register, handleSubmit } = formMethods

  const onSubmit = handleSubmit((data) => {
    updateOrg({ id: Number(orgId), updateOrganizationDto: { name: data.name } })
  })

  return (
    <div>
      <Typography variant="h2" mb={3}>
        Settings
      </Typography>
      <Card>
        <Grid2 container p={4}>
          <Grid2 size={4}>
            <Typography fontWeight="bold">General</Typography>
          </Grid2>
          <Grid2 size={8}>
            <Typography mb={2}>
              The organization name is visible in the sidebar menu, headings to all its members. Usually it’s a name of
              the company or a business. How is this data stored?
            </Typography>

            <FormProvider {...formMethods}>
              <form onSubmit={onSubmit}>
                <TextField
                  {...register('name')}
                  label="Organization name"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <Button variant="contained" type="submit" sx={{ mt: 2 }}>
                  Save
                </Button>
              </form>
            </FormProvider>
          </Grid2>
        </Grid2>
      </Card>
    </div>
  )
}

export default OrgsSettings
