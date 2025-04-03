import { type ReactElement, useState, useMemo } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { SvgIcon, Typography } from '@mui/material'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import useAddressBook from '@/hooks/useAddressBook'
import AddressInput, { type AddressInputProps } from '../AddressInput'
import EthHashInfo from '../EthHashInfo'
import InfoIcon from '@/public/images/notifications/info.svg'
import EntryDialog from '@/components/address-book/EntryDialog'
import css from './styles.module.css'
import inputCss from '@/styles/inputs.module.css'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const abFilterOptions = createFilterOptions({
  stringify: (option: { label: string; name: string }) => option.name + ' ' + option.label,
})

/**
 *  Temporary component until revamped safe components are done
 */
const AddressBookInput = ({ name, canAdd, ...props }: AddressInputProps & { canAdd?: boolean }): ReactElement => {
  const addressBook = useAddressBook()
  const { setValue, control } = useFormContext()
  const addressValue = useWatch({ name, control })
  const [open, setOpen] = useState(false)
  const [openAddressBook, setOpenAddressBook] = useState<boolean>(false)

  const addressBookEntries = Object.entries(addressBook).map(([address, name]) => ({
    label: address,
    name,
  }))

  const hasVisibleOptions = useMemo(
    () => !!addressBookEntries.filter((entry) => entry.label.includes(addressValue)).length,
    [addressBookEntries, addressValue],
  )

  const isInAddressBook = useMemo(
    () => addressBookEntries.some((entry) => sameAddress(entry.label, addressValue)),
    [addressBookEntries, addressValue],
  )

  const customFilterOptions = (options: any, state: any) => {
    // Don't show suggestions from the address book once a valid address has been entered.
    if (isValidAddress(addressValue)) return []
    return abFilterOptions(options, state)
  }

  const handleOpenAutocomplete = () => {
    setOpen((value) => !value)
  }

  const onAddressBookClick = canAdd
    ? () => {
        setOpenAddressBook(true)
      }
    : undefined

  return (
    <>
      <Controller
        name={name}
        control={control}
        // eslint-disable-next-line
        render={({ field: { ref, ...field } }) => (
          <Autocomplete
            {...field}
            className={inputCss.input}
            disableClearable
            disabled={props.disabled}
            readOnly={props.InputProps?.readOnly}
            freeSolo
            options={addressBookEntries}
            onChange={(_, value) => (typeof value === 'string' ? field.onChange(value) : field.onChange(value.label))}
            onInputChange={(_, value) => setValue(name, value)}
            filterOptions={customFilterOptions}
            componentsProps={{
              paper: {
                elevation: 2,
              },
            }}
            renderOption={(props, option) => {
              const { key, ...rest } = props
              return (
                <Typography data-testid="address-item" component="li" variant="body2" {...rest} key={key}>
                  <EthHashInfo address={option.label} name={option.name} shortAddress={false} copyAddress={false} />
                </Typography>
              )
            }}
            renderInput={(params) => (
              <AddressInput
                data-testid="address-item"
                {...params}
                {...props}
                focused={props.focused || !addressValue}
                name={name}
                onOpenListClick={hasVisibleOptions ? handleOpenAutocomplete : undefined}
                isAutocompleteOpen={open}
                onAddressBookClick={canAdd && !isInAddressBook ? onAddressBookClick : undefined}
              />
            )}
          />
        )}
      />

      {canAdd && !isInAddressBook ? (
        <Typography variant="body2" className={css.unknownAddress}>
          <SvgIcon component={InfoIcon} fontSize="small" />
          <span>
            This is an unknown address. You can{' '}
            <a role="button" onClick={onAddressBookClick}>
              add it to your address book
            </a>
            .
          </span>
        </Typography>
      ) : null}

      {openAddressBook && (
        <EntryDialog
          handleClose={() => setOpenAddressBook(false)}
          defaultValues={{ name: '', address: addressValue }}
        />
      )}
    </>
  )
}

export default AddressBookInput
