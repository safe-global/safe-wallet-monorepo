import { type ReactElement, useEffect, useMemo, useState } from 'react'
import { IconButton, InputAdornment, Skeleton, SvgIcon, TextField, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import classnames from 'classnames'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { isAddress } from 'viem'
import useNameResolver from '@/components/common/AddressInput/useNameResolver'
import EthHashInfo from '@/components/common/EthHashInfo'
import Identicon from '@/components/common/Identicon'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import CaretDownIcon from '@/public/images/common/caret-down.svg'
import inputCss from '@/styles/inputs.module.css'
import { EMAIL_MAX_LENGTH, isEmailAddress } from './utils'
import css from './styles.module.css'

type AddressBook = Record<string, string>

type AddMemberInputProps = {
  addressBook: AddressBook
  error?: string
  inputProps: UseFormRegisterReturn<'inviteeIdentifier'>
  onSelectAddress: (address: string, name: string) => void
  value: string
}

type InviteeIdentifierOption = { address: string; name: string }

const MAX_VISIBLE_OPTIONS = 5

/**
 * Invite-specific input for choosing who to invite.
 *
 * Unlike AddressBookInput/AddressInput, this accepts either an email or a wallet
 * inviteeIdentifier. Address-book names and ENS names are resolved to addresses before
 * submit; emails are kept as-is.
 */
const AddMemberInput = ({
  addressBook,
  error,
  inputProps,
  onSelectAddress,
  value,
}: AddMemberInputProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const inviteeIdentifier = value.trim()
  const shouldResolveName = Boolean(
    inviteeIdentifier && !isEmailAddress(inviteeIdentifier) && !isAddress(inviteeIdentifier),
  )
  const { address: resolvedAddress } = useNameResolver(shouldResolveName ? inviteeIdentifier : '')

  useEffect(() => {
    if (resolvedAddress) {
      onSelectAddress(resolvedAddress, inviteeIdentifier)
    }
  }, [inviteeIdentifier, onSelectAddress, resolvedAddress])

  const options = useMemo<InviteeIdentifierOption[]>(() => {
    const query = inviteeIdentifier.toLowerCase()

    if (!query || isAddress(query)) {
      return []
    }

    return Object.entries(addressBook)
      .filter(([address, name]) => address.toLowerCase().includes(query) || name.toLowerCase().includes(query))
      .slice(0, MAX_VISIBLE_OPTIONS)
      .map(([address, name]) => ({ address, name }))
  }, [addressBook, inviteeIdentifier])

  const showIdenticon = Boolean(value && !error && isAddress(value))
  const showInitials = Boolean(value && !error && !showIdenticon && isEmailAddress(inviteeIdentifier))

  const renderAvatar = () => {
    if (showIdenticon) {
      return <Identicon address={value} size={32} />
    }
    if (showInitials) {
      return <InitialsAvatar name={inviteeIdentifier} size="medium" rounded />
    }
    return <Skeleton variant="circular" width={32} height={32} animation={false} />
  }

  const startAdornment = (
    <InputAdornment position="start" sx={{ ml: 0, mr: 1 }}>
      {renderAvatar()}
    </InputAdornment>
  )

  const endAdornment =
    options.length > 0 ? (
      <InputAdornment position="end">
        <IconButton
          className={classnames(css.openButton, { [css.rotated]: isOpen })}
          color="primary"
          onClick={() => setIsOpen((open) => !open)}
          tabIndex={-1}
        >
          <SvgIcon component={CaretDownIcon} inheritViewBox fontSize="small" />
        </IconButton>
      </InputAdornment>
    ) : null

  return (
    <Autocomplete<InviteeIdentifierOption, false, true, true>
      freeSolo
      disableClearable
      open={isOpen && options.length > 0}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      className={inputCss.input}
      options={options}
      // Address book entries are already filtered against the current input value.
      filterOptions={(opts) => opts}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.address)}
      inputValue={value}
      onInputChange={(_, newValue, reason) => {
        if (reason === 'input') {
          inputProps.onChange({ target: { name: inputProps.name, value: newValue } } as never)
        }
      }}
      onChange={(_, option) => {
        if (option && typeof option !== 'string') {
          onSelectAddress(option.address, option.name)
          setIsOpen(false)
        }
      }}
      componentsProps={{ paper: { elevation: 2 } }}
      renderOption={(props, option) => {
        const { key, ...rest } = props
        return (
          <Typography component="li" variant="body2" {...rest} key={key}>
            <EthHashInfo address={option.address} name={option.name} shortAddress={false} copyAddress={false} />
          </Typography>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          name={inputProps.name}
          inputRef={inputProps.ref}
          onBlur={inputProps.onBlur}
          label={error || 'Address or email'}
          required={!error}
          error={!!error}
          fullWidth
          autoComplete="off"
          spellCheck={false}
          inputProps={{
            ...params.inputProps,
            'data-testid': 'member-invitee-identifier-input',
            maxLength: EMAIL_MAX_LENGTH,
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment,
            endAdornment,
          }}
          InputLabelProps={{ shrink: true }}
        />
      )}
    />
  )
}

export default AddMemberInput
