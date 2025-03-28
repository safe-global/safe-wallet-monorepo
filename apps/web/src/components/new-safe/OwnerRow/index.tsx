import { useCallback, useEffect, useMemo } from 'react'
import { CircularProgress, FormControl, Grid, IconButton, SvgIcon, Typography } from '@mui/material'
import NameInput from '@/components/common/NameInput'
import InputAdornment from '@mui/material/InputAdornment'
import AddressBookInput from '@/components/common/AddressBookInput'
import DeleteIcon from '@/public/images/common/delete.svg'
import { useFormContext, useWatch } from 'react-hook-form'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { NamedAddress } from '@/components/new-safe/create/types'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import css from './styles.module.css'
import classNames from 'classnames'

export const OwnerRow = ({
  index,
  groupName,
  removable = true,
  remove,
  readOnly = false,
}: {
  index: number
  removable?: boolean
  groupName: string
  remove?: (index: number) => void
  readOnly?: boolean
}) => {
  const wallet = useWallet()
  const fieldName = `${groupName}.${index}`
  const { control, getValues, setValue } = useFormContext()
  const owners = useWatch({
    control,
    name: groupName,
  })
  const owner = useWatch({
    control,
    name: fieldName,
  })

  const deps = useMemo(() => {
    return Array.from({ length: owners.length }, (_, i) => `${groupName}.${i}`)
  }, [owners, groupName])

  const validateSafeAddress = useCallback(
    async (address: string) => {
      const owners = getValues('owners')
      if (owners.filter((owner: NamedAddress) => sameAddress(owner.address, address)).length > 1) {
        return 'Signer is already added'
      }
    },
    [getValues],
  )

  const { name, ens, resolving } = useAddressResolver(owner.address)

  useEffect(() => {
    if (name && !getValues(`${fieldName}.name`)) {
      setValue(`${fieldName}.name`, name)
    }
  }, [setValue, getValues, name, fieldName])

  useEffect(() => {
    if (ens) {
      setValue(`${fieldName}.ens`, ens)
    }
  }, [ens, setValue, fieldName])

  const walletIsOwner = owner.address === wallet?.address

  return (
    <Grid
      container
      spacing={3}
      className={classNames({ [css.helper]: walletIsOwner })}
      sx={{
        alignItems: 'center',
        marginBottom: 3,
        flexWrap: ['wrap', undefined, 'nowrap'],
      }}
    >
      <Grid item xs={12} md={readOnly ? 5 : 4}>
        <FormControl fullWidth>
          <NameInput
            data-testid="owner-name"
            name={`${fieldName}.name`}
            label="Signer name"
            InputLabelProps={{ shrink: true }}
            placeholder={ens || `Signer ${index + 1}`}
            helperText={walletIsOwner && 'Your connected wallet'}
            InputProps={{
              endAdornment: resolving ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            }}
          />
        </FormControl>
      </Grid>
      <Grid item xs={11} md={7}>
        {readOnly ? (
          <Typography variant="body2" component="div">
            <EthHashInfo address={owner.address} shortAddress hasExplorer showCopyButton />
          </Typography>
        ) : (
          <FormControl fullWidth>
            <AddressBookInput name={`${fieldName}.address`} label="Signer" validate={validateSafeAddress} deps={deps} />
          </FormControl>
        )}
      </Grid>
      {!readOnly && (
        <Grid
          item
          xs={1}
          sx={{
            ml: -2,
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {removable && (
            <>
              <IconButton data-testid="remove-owner-btn" onClick={() => remove?.(index)} aria-label="Remove signer">
                <SvgIcon component={DeleteIcon} inheritViewBox />
              </IconButton>
            </>
          )}
        </Grid>
      )}
    </Grid>
  )
}

export default OwnerRow
