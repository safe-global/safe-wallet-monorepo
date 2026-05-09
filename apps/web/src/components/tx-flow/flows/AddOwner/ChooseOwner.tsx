import {
  Box,
  Typography,
  FormControl,
  InputAdornment,
  CircularProgress,
  Button,
  CardActions,
  Divider,
  Grid,
  TextField,
  MenuItem,
  SvgIcon,
  Tooltip,
} from '@mui/material'
import { useForm, FormProvider, Controller } from 'react-hook-form'

import AddressBookInput from '@/components/common/AddressBookInput'
import NameInput from '@/components/common/NameInput'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import useSafeInfo from '@/hooks/useSafeInfo'
import { uniqueAddress, addressIsNotCurrentSafe } from '@safe-global/utils/utils/validation'
import type { AddOwnerFlowProps } from '.'
import type { ReplaceOwnerFlowProps } from '../ReplaceOwner'
import TxCard from '../../common/TxCard'
import InfoIcon from '@/public/images/notifications/info.svg'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TOOLTIP_TITLES } from '@/components/tx-flow/common/constants'
import EthHashInfo from '@/components/common/EthHashInfo'
import { maybePlural } from '@safe-global/utils/utils/formatters'

type FormData = Pick<AddOwnerFlowProps | ReplaceOwnerFlowProps, 'newOwner' | 'threshold'>

export enum ChooseOwnerMode {
  REPLACE,
  ADD,
}

export const ChooseOwner = ({
  params,
  onSubmit,
  mode,
}: {
  params: AddOwnerFlowProps | ReplaceOwnerFlowProps
  onSubmit: (data: FormData) => void
  mode: ChooseOwnerMode
}) => {
  const { safe, safeAddress } = useSafeInfo()

  const formMethods = useForm<FormData>({
    defaultValues: params,
    mode: 'onChange',
  })
  const { handleSubmit, formState, watch, control } = formMethods
  const isValid = Object.keys(formState.errors).length === 0 // do not use formState.isValid because names can be empty

  const notAlreadyOwner = uniqueAddress(safe.owners.map((owner) => owner.value))
  const notCurrentSafe = addressIsNotCurrentSafe(safeAddress)
  const combinedValidate = (address: string) => notAlreadyOwner(address) || notCurrentSafe(address)

  const address = watch('newOwner.address')

  const { name, ens, resolving } = useAddressResolver(address)

  // Address book, ENS
  const fallbackName = name || ens

  const onFormSubmit = handleSubmit((formData: FormData) => {
    onSubmit({
      ...formData,
      newOwner: {
        ...formData.newOwner,
        name: formData.newOwner.name || fallbackName,
      },
      threshold: formData.threshold,
    })
  })

  const newNumberOfOwners = safe.owners.length + (!params.removedOwner ? 1 : 0)

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={onFormSubmit} className={commonCss.form}>
          {params.removedOwner && (
            <>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                }}
              >
                {params.removedOwner &&
                  'Review the signer you want to replace in the active Safe Account, then specify the new signer you want to replace it with:'}
              </Typography>
              <Box
                sx={{
                  my: 3,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mb: 1,
                  }}
                >
                  Current signer
                </Typography>
                <EthHashInfo address={params.removedOwner.address} showCopyButton shortAddress={false} hasExplorer />
              </Box>
            </>
          )}

          <FormControl fullWidth>
            <NameInput
              label="New signer"
              name="newOwner.name"
              placeholder={fallbackName || 'Signer name'}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: resolving && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          <FormControl fullWidth>
            <AddressBookInput
              name="newOwner.address"
              label="Signer address or ENS"
              validate={combinedValidate}
              required
            />
          </FormControl>

          <Divider className={commonCss.nestedDivider} />

          {mode === ChooseOwnerMode.ADD && (
            <FormControl fullWidth>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mt: 3,
                }}
              >
                Threshold
                <Tooltip title={TOOLTIP_TITLES.THRESHOLD} arrow placement="top">
                  <span>
                    <SvgIcon
                      component={InfoIcon}
                      inheritViewBox
                      color="border"
                      fontSize="small"
                      sx={{
                        verticalAlign: 'middle',
                        ml: 0.5,
                      }}
                    />
                  </span>
                </Tooltip>
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mb: 1,
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
                    control={control}
                    name="threshold"
                    render={({ field }) => (
                      <TextField data-testid="owner-number-dropdown" select {...field}>
                        {safe.owners.map((_, idx) => (
                          <MenuItem key={idx + 1} value={idx + 1}>
                            {idx + 1}
                          </MenuItem>
                        ))}
                        {!params.removedOwner && (
                          <MenuItem key={newNumberOfOwners} value={newNumberOfOwners}>
                            {newNumberOfOwners}
                          </MenuItem>
                        )}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item>
                  <Typography>
                    out of {newNumberOfOwners} signer{maybePlural(newNumberOfOwners)}
                  </Typography>
                </Grid>
              </Grid>
            </FormControl>
          )}

          <Divider className={commonCss.nestedDivider} />

          <CardActions>
            <Button data-testid="add-owner-next-btn" variant="contained" type="submit" disabled={!isValid || resolving}>
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}
