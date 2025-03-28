import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form'
import {
  Box,
  Button,
  CardActions,
  Divider,
  Grid,
  MenuItem,
  SvgIcon,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import TxCard from '../../common/TxCard'
import { maybePlural } from '@/utils/formatters'
import OwnerRow from '@/components/new-safe/OwnerRow'
import InfoIcon from '@/public/images/notifications/info.svg'
import { sameAddress } from '@/utils/addresses'
import { ChangeOwnerStructureFormFields } from '.'
import type { ChangeOwnerStructureForm } from '.'

export function SetupStructure({
  params,
  onSubmit,
}: {
  params: ChangeOwnerStructureForm
  onSubmit: (data: ChangeOwnerStructureForm) => void
}): ReactElement {
  const { safe } = useSafeInfo()

  const formMethods = useForm<ChangeOwnerStructureForm>({
    defaultValues: params,
    mode: 'onChange',
  })
  const fieldArray = useFieldArray<ChangeOwnerStructureForm>({
    control: formMethods.control,
    name: ChangeOwnerStructureFormFields.owners,
  })

  const newOwners = formMethods.watch(ChangeOwnerStructureFormFields.owners)
  const newThreshold = formMethods.watch(ChangeOwnerStructureFormFields.threshold)

  // TODO: Include validation that the Safe is not being set as an owner, nor are duplicates
  const isSameOwners = newOwners.every((newOwner) => {
    return safe.owners.some((currentOwner) => sameAddress(currentOwner.value, newOwner.address))
  })
  const isSameThreshold = safe.threshold === newThreshold

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className={commonCss.form}>
          {fieldArray.fields.map((field, index) => {
            return (
              <OwnerRow
                key={field.id}
                index={index}
                groupName={ChangeOwnerStructureFormFields.owners}
                removable={index > 0}
                remove={fieldArray.remove}
              />
            )
          })}
          <Button
            variant="text"
            onClick={() => fieldArray.append({ name: '', address: '' }, { shouldFocus: true })}
            startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
            size="large"
          >
            Add new signer
          </Button>

          <Divider className={commonCss.nestedDivider} />

          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              Threshold
              <Tooltip
                title="The threshold of a Safe Account specifies how many signers need to confirm a Safe Account transaction before it can be executed."
                arrow
                placement="top"
              >
                <span style={{ display: 'flex' }}>
                  <SvgIcon component={InfoIcon} inheritViewBox color="border" fontSize="small" />
                </span>
              </Tooltip>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 2,
              }}
            >
              Any transaction requires the confirmation of:
            </Typography>
            <Grid
              container
              direction="row"
              sx={{
                alignItems: 'center',
                gap: 2,
                pt: 1,
              }}
            >
              <Grid item>
                <Controller
                  control={formMethods.control}
                  name="threshold"
                  render={({ field }) => (
                    <TextField select {...field}>
                      {newOwners.map((_, index) => (
                        <MenuItem key={index + 1} value={index + 1}>
                          {index + 1}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item>
                <Typography>
                  out of {newOwners.length} signer{maybePlural(newOwners)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider className={commonCss.nestedDivider} />

          <CardActions>
            <Button variant="contained" type="submit" disabled={isSameOwners && isSameThreshold}>
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}
