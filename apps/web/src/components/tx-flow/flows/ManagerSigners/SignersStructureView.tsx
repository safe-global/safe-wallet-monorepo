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
import { Controller, FormProvider } from 'react-hook-form'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import AddIcon from '@/public/images/common/add.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import TxCard from '../../common/TxCard'
import OwnerRow from '@/components/new-safe/OwnerRow'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { ManageSignersFormFields } from '.'
import { TxFlowContext } from '../../TxFlowProvider'
import { SETTINGS_EVENTS, SETTINGS_LABELS, trackEvent } from '@/services/analytics'
import Track from '@/components/common/Track'
import type { TxFlowContextType } from '../../TxFlowProvider'
import type { ManageSignersForm } from '.'
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form'

type Props = {
  formMethods: UseFormReturn<ManageSignersForm>
  fieldArray: UseFieldArrayReturn<ManageSignersForm, 'owners'>
  newOwners: ManageSignersForm['owners']
  isSameSetup: boolean
  onRemove: (index: number) => void
  onAdd: () => void
}

export function SignersStructureView(props: Props): ReactElement {
  const { onNext } = useContext<TxFlowContextType<ManageSignersForm>>(TxFlowContext)

  return (
    <TxCard>
      <FormProvider {...props.formMethods}>
        <form onSubmit={props.formMethods.handleSubmit(onNext)} className={commonCss.form}>
          <Signers {...props} />

          <Divider className={commonCss.nestedDivider} />

          <Threshold {...props} />

          <Divider className={commonCss.nestedDivider} />

          <CardActions>
            <Button
              variant="contained"
              type="submit"
              disabled={props.isSameSetup || !props.formMethods.formState.isValid}
            >
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

function Signers({
  fieldArray,
  onRemove: _onRemove,
  onAdd,
}: Pick<Props, 'fieldArray' | 'onAdd' | 'onRemove'>): ReactElement {
  const onRemove = (index: number) => {
    _onRemove(index)
    trackEvent({ ...SETTINGS_EVENTS.SETUP.REMOVE_OWNER, label: SETTINGS_LABELS.manage_signers })
  }

  return (
    <>
      {fieldArray.fields.map((field, index) => (
        <OwnerRow
          key={field.id}
          index={index}
          groupName={ManageSignersFormFields.owners}
          removable={fieldArray.fields.length > 1}
          remove={onRemove}
        />
      ))}

      <Track {...SETTINGS_EVENTS.SETUP.ADD_OWNER} label={SETTINGS_LABELS.manage_signers}>
        <Button
          variant="text"
          onClick={onAdd}
          startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
          size="large"
          sx={{ mt: -1, mb: 3 }}
        >
          Add new signer
        </Button>
      </Track>
    </>
  )
}

function Threshold({ formMethods, newOwners }: Pick<Props, 'formMethods' | 'newOwners'>): ReactElement {
  return (
    <Box my={3}>
      <Typography variant="h4" fontWeight={700} display="inline-flex" alignItems="center" gap={1}>
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

      <Typography variant="body2" mb={2}>
        Any transaction requires the confirmation of:
      </Typography>

      <Grid container direction="row" sx={{ alignItems: 'center', gap: 2, pt: 1 }}>
        <Grid item>
          <Controller
            control={formMethods.control}
            name="threshold"
            render={({ field }) => {
              const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                field.onChange(event)
                trackEvent({ ...SETTINGS_EVENTS.SETUP.CHANGE_THRESHOLD, label: SETTINGS_LABELS.manage_signers })
              }

              return (
                <TextField select {...field} onChange={onChange}>
                  {newOwners.map((_, index) => (
                    <MenuItem key={index + 1} value={index + 1}>
                      {index + 1}
                    </MenuItem>
                  ))}
                </TextField>
              )
            }}
          />
        </Grid>
        <Grid item>
          <Typography>
            out of {newOwners.length} signer{maybePlural(newOwners)}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  )
}
