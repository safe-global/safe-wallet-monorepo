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
import { useContext, type ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import useSafeInfo from '@/hooks/useSafeInfo'
import TxCard from '../../common/TxCard'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import OwnerRow from '@/components/new-safe/OwnerRow'
import InfoIcon from '@/public/images/notifications/info.svg'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ChangeOwnerStructureFormFields } from '.'
import { TxFlowContext } from '../../TxFlowProvider'
import type { ChangeOwnerStructureForm } from '.'
import type { TxFlowContextType } from '../../TxFlowProvider'

export function SetupStructure(): ReactElement {
  const { onNext, data } = useContext<TxFlowContextType<ChangeOwnerStructureForm>>(TxFlowContext)
  const { safe } = useSafeInfo()

  const formMethods = useForm<ChangeOwnerStructureForm>({
    defaultValues: data,
    mode: 'onChange',
  })
  const fieldArray = useFieldArray<ChangeOwnerStructureForm>({
    control: formMethods.control,
    name: ChangeOwnerStructureFormFields.owners,
  })

  const newOwners = formMethods.watch(ChangeOwnerStructureFormFields.owners)
  const newThreshold = formMethods.watch(ChangeOwnerStructureFormFields.threshold)

  const onRemove = (index: number) => {
    fieldArray.remove(index)
    // newOwners does not update immediately after removal
    const newOwnersLength = newOwners.length - 1
    if (newThreshold > newOwnersLength) {
      formMethods.setValue(ChangeOwnerStructureFormFields.threshold, newOwnersLength)
    }
  }

  const isSameOwners =
    newOwners.length === safe.owners.length &&
    newOwners.every((newOwner) => {
      return safe.owners.some((currentOwner) => sameAddress(currentOwner.value, newOwner.address))
    })
  const isSameThreshold = safe.threshold === newThreshold

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onNext)} className={commonCss.form}>
          {fieldArray.fields.map((field, index) => {
            return (
              <OwnerRow
                key={field.id}
                index={index}
                groupName={ChangeOwnerStructureFormFields.owners}
                removable={fieldArray.fields.length > 1}
                remove={onRemove}
              />
            )
          })}
          <Button
            variant="text"
            onClick={() => fieldArray.append({ name: '', address: '' }, { shouldFocus: true })}
            startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
            size="large"
            sx={{ mt: -1, mb: 3 }}
          >
            Add new signer
          </Button>

          <Divider className={commonCss.nestedDivider} />

          <Box sx={{ my: 3 }}>
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
            <Button
              variant="contained"
              type="submit"
              disabled={(isSameOwners && isSameThreshold) || !formMethods.formState.isValid}
            >
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}
