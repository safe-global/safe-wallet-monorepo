import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import useSafeInfo from '@/hooks/useSafeInfo'
import { AddressPoisoningGuard, type BlockedHint } from '@/features/address-poisoning'

const OwnerRow = ({
  index,
  groupName,
  removable = true,
  remove,
  readOnly = false,
  rowId,
  onPoisoningChange,
}: {
  index: number
  removable?: boolean
  groupName: string
  remove?: (index: number) => void
  readOnly?: boolean
  /** Stable field id, used to report this row's poisoning hint up to the parent's footer. */
  rowId?: string
  /** Reports this row's poisoning hint so the parent can show it next to its Next button. */
  onPoisoningChange?: (id: string, hint?: BlockedHint) => void
}) => {
  const { safeAddress } = useSafeInfo()
  const wallet = useWallet()
  const fieldName = `${groupName}.${index}`
  const { control, getValues, setValue, trigger } = useFormContext()
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

  // Address-poisoning guard: warns + blocks (until verified) when the signer resembles a trusted
  // anchor. Mirror its blocked state into form validity (the flow's Next gates on it).
  const addressFieldName = `${fieldName}.address`
  const [poisoningBlocked, setPoisoningBlocked] = useState(false)
  const blockedRef = useRef(poisoningBlocked)
  blockedRef.current = poisoningBlocked
  useEffect(() => {
    void trigger(addressFieldName)
  }, [poisoningBlocked, trigger, addressFieldName])

  // Mirror the block into form validity (above) and report the hint up so the parent flow can
  // show "verify to continue" next to its Next button.
  const reportRef = useRef(onPoisoningChange)
  reportRef.current = onPoisoningChange
  const onGuardBlockedChange = useCallback(
    (blocked: boolean, hint?: BlockedHint) => {
      setPoisoningBlocked(blocked)
      if (rowId) reportRef.current?.(rowId, hint)
    },
    [rowId],
  )
  useEffect(() => () => void (rowId && reportRef.current?.(rowId, undefined)), [rowId])

  const validateOwnerAddress = useCallback(
    async (address: string) => {
      if (sameAddress(address, safeAddress)) {
        return 'The Safe account cannot own itself'
      }
      const owners = getValues('owners')
      if (owners.filter((owner: NamedAddress) => sameAddress(owner.address, address)).length > 1) {
        return 'Signer is already added'
      }
      // Block until the guard's verification is satisfied (false = invalid, no message;
      // the guard banner is the single explanation).
      if (blockedRef.current) {
        return false
      }
    },
    [getValues, safeAddress],
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
    <>
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
              <AddressBookInput
                name={`${fieldName}.address`}
                label="Signer"
                validate={validateOwnerAddress}
                deps={deps}
                onReset={() => setValue(`${fieldName}.name`, '')}
              />
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

      {!readOnly && (
        <AddressPoisoningGuard name={addressFieldName} context="add-entity" onBlockedChange={onGuardBlockedChange} />
      )}
    </>
  )
}

export default OwnerRow
