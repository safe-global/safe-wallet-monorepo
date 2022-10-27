import { Button, Grid, SvgIcon, MenuItem, Select, Tooltip, Typography, Divider, Box } from '@mui/material'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { OwnerRow } from './OwnerRow'
import type { NamedAddress } from '@/components/create-safe/types'
import type { StepRenderProps } from '../../CardStepper/useCardStepper'
import type { NewSafeFormData } from '../../CreateSafe'

type CreateSafeStep2Form = {
  owners: NamedAddress[]
  mobileOwners: NamedAddress[]
  threshold: number
}

enum CreateSafeStep2Fields {
  owners = 'owners',
  mobileOwners = 'mobileOwners',
  threshold = 'threshold',
}

const STEP_2_FORM_ID = 'create-safe-step-2-form'

const CreateSafeStep2 = ({
  onSubmit,
  onBack,
  data,
}: Pick<StepRenderProps<NewSafeFormData>, 'onSubmit' | 'data' | 'onBack'>): ReactElement => {
  const formMethods = useForm<CreateSafeStep2Form>({
    mode: 'all',
    defaultValues: {
      [CreateSafeStep2Fields.owners]: data.owners,
      [CreateSafeStep2Fields.mobileOwners]: data.mobileOwners,
      [CreateSafeStep2Fields.threshold]: data.threshold,
    },
  })

  const { register, handleSubmit, control, watch } = formMethods

  const allFormData = watch()

  const { fields: ownerFields, append: appendOwner, remove: removeOwner } = useFieldArray({ control, name: 'owners' })

  const {
    fields: mobileOwnerFields,
    append: appendMobileOwner,
    remove: removeMobileOwner,
  } = useFieldArray({ control, name: 'mobileOwners' })

  const allOwners = [...ownerFields, ...mobileOwnerFields]

  const handleBack = () => {
    onBack(allFormData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} id={STEP_2_FORM_ID}>
      <FormProvider {...formMethods}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {ownerFields.map((field, i) => (
              <OwnerRow
                key={field.id}
                index={i}
                removable={i > 0}
                groupName={CreateSafeStep2Fields.owners}
                remove={removeOwner}
              />
            ))}
            <Button
              variant="text"
              onClick={() => appendOwner({ name: '', address: '' }, { shouldFocus: true })}
              startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
            >
              Add new owner
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={700} display="inline-flex" alignItems="center" gap={1}>
              Safe Mobile owner key (optional){' '}
              <Tooltip title="TODO: Add tooltip" arrow placement="top">
                <span style={{ display: 'flex' }}>
                  <SvgIcon component={InfoIcon} inheritViewBox color="border" fontSize="small" />
                </span>
              </Tooltip>
            </Typography>
            <Typography variant="body2">
              Add an extra layer of security and sign transactions with the Safe Mobile app.
            </Typography>
          </Grid>

          <Grid item xs={12}>
            {mobileOwnerFields.map((field, i) => (
              <OwnerRow
                key={field.id}
                groupName={CreateSafeStep2Fields.mobileOwners}
                index={i}
                remove={removeMobileOwner}
              />
            ))}
            <Button
              variant="text"
              onClick={() => appendMobileOwner({ name: '', address: '' }, { shouldFocus: true })}
              startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
            >
              Add mobile owner
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ ml: '-52px', mr: '-52px', mb: 4, mt: 3 }} />
            <Typography variant="h4" fontWeight={700} display="inline-flex" alignItems="center" gap={1}>
              Threshold
              <Tooltip title="TODO: Add tooltip" arrow placement="top">
                <span style={{ display: 'flex' }}>
                  <SvgIcon component={InfoIcon} inheritViewBox color="border" fontSize="small" />
                </span>
              </Tooltip>
            </Typography>
            <Typography variant="body2" mb={2}>
              Any transaction requires the confirmation of:
            </Typography>
            <Select {...register(CreateSafeStep2Fields.threshold)} defaultValue={data.threshold}>
              {allOwners.map((_, i) => (
                <MenuItem key={i} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>{' '}
            out of {allOwners.length} owner(s).
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ ml: '-52px', mr: '-52px', mb: 4, mt: 3, alignSelf: 'normal' }} />
            <Box display="flex" flexDirection="row" gap={3}>
              <Button variant="outlined" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" variant="contained">
                Continue
              </Button>
            </Box>
          </Grid>
        </Grid>
      </FormProvider>
    </form>
  )
}

export default CreateSafeStep2
