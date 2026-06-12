import { type ReactElement, useState, useMemo, Children } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { SvgIcon, Typography } from '@mui/material'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import AddressInput, { type AddressInputProps } from '../AddressInput'
import InfoIcon from '@/public/images/notifications/info.svg'
import EntryDialog from '@/components/address-book/EntryDialog'
import css from './styles.module.css'
import inputCss from '@/styles/inputs.module.css'
import { isValidAddress } from '@safe-global/utils/utils/validation'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { ContactSource } from '@/hooks/useAllAddressBooks'
import { useMergedAddressBooks, useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { useCurrentChain } from '@/hooks/useChains'
import useChainId from '@/hooks/useChainId'
import { useMemberNameResolver } from '@/features/spaces/hooks/useMemberNameResolver'
import RecipientOption from './RecipientOption'
import RecipientGroupHeader from './RecipientGroupHeader'
import useWorkspaceName from './useWorkspaceName'

const abFilterOptions = createFilterOptions({
  stringify: (option: { label: string; name: string }) => option.name + ' ' + option.label,
})

/**
 *  Temporary component until revamped safe components are done
 */
const AddressBookInput = ({ name, canAdd, ...props }: AddressInputProps & { canAdd?: boolean }): ReactElement => {
  const [open, setOpen] = useState(false)
  const [openAddressBook, setOpenAddressBook] = useState<boolean>(false)
  const mergedAddressBook = useMergedAddressBooks()
  const workspaceName = useWorkspaceName()
  const prefix = useCurrentChain()?.shortName
  const chainId = useChainId()
  const resolveSafeName = useSafeNameResolver()
  const resolveMemberName = useMemberNameResolver()

  const { setValue, control } = useFormContext()
  const addressValue = useWatch({ name, control })

  const allAddressBookEntries = useMemo(
    () =>
      mergedAddressBook.list
        // Only suggest contacts configured for the chain we are sending on
        .filter((entry) => entry.chainIds.includes(chainId))
        .map((entry) => ({
          label: entry.address,
          name: entry.name,
          source: entry.source,
          contact: entry,
        })),
    [mergedAddressBook, chainId],
  )

  const hasVisibleOptions = useMemo(
    () => !!allAddressBookEntries.filter((entry) => entry.label.includes(addressValue)).length,
    [allAddressBookEntries, addressValue],
  )

  const isInAddressBook = useMemo(
    () => allAddressBookEntries.some((entry) => sameAddress(entry.label, addressValue)),
    [allAddressBookEntries, addressValue],
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
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            disableClearable
            disabled={props.disabled}
            readOnly={props.InputProps?.readOnly}
            freeSolo
            options={allAddressBookEntries}
            onChange={(_, value) => (typeof value === 'string' ? field.onChange(value) : field.onChange(value.label))}
            onInputChange={(_, value) => setValue(name, value)}
            filterOptions={customFilterOptions}
            componentsProps={{
              paper: {
                elevation: 2,
              },
            }}
            ListboxProps={{ className: css.listbox }}
            groupBy={(option) => option.source}
            renderGroup={(params) => (
              <li key={params.key}>
                <RecipientGroupHeader
                  source={params.group as ContactSource}
                  workspaceName={workspaceName}
                  count={Children.count(params.children)}
                />
                <ul className={css.groupList}>{params.children}</ul>
              </li>
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props
              return (
                <Typography data-testid="address-item" component="li" variant="body2" {...rest} key={key}>
                  <RecipientOption
                    contact={option.contact}
                    prefix={prefix}
                    memberName={resolveMemberName(option.contact.createdByUserId)}
                    resolveName={(address) => resolveSafeName(address, chainId)}
                  />
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
