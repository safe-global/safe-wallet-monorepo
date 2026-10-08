import { useEffect, useState } from 'react'
import get from 'lodash/get'
import { useFormContext, useWatch } from 'react-hook-form'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, NAME_MIN_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'
import NameInput from '@/components/common/NameInput'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import type { AllSafeItems } from '@/hooks/safes'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import { nameFieldKey } from './utils'
import { validateContactName } from '../SpaceAddressBook/utils'
import {
  NameAccountCellView,
  NameAccountsFieldsView,
} from '@views/features/spaces/components/NameAccounts/NameAccountsFieldsView'

const COLUMNS: SafeAccountColumnId[] = ['name', 'threshold', 'networks', 'balance']

const NameAccountCell = ({ address }: { address: string }) => {
  const key = nameFieldKey(address)
  const { formState } = useFormContext<AddAccountsFormValues>()
  const value = sanitizeName(useWatch({ name: key }) ?? '')
  const [focused, setFocused] = useState(false)
  const isTouched = Boolean(get(formState.touchedFields, key))
  const nameError = validateContactName(value)
  // Shown only while unfocused: the message takes the address line's place, so typing keeps the address visible.
  let error: string | undefined
  if (!focused) {
    if (value !== '') error = nameError
    else if (isTouched) error = 'Name is required'
  }
  const showInput = focused || Boolean(nameError)
  const startEditing = () => setFocused(true)

  return (
    <NameAccountCellView
      address={address}
      value={value}
      showInput={showInput}
      error={error}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onStartEditing={startEditing}
      renderNameInput={(props) => (
        <NameInput
          {...props}
          name={key}
          autoFocus={focused}
          validateCharset
          minLength={NAME_MIN_LENGTH}
          maxLength={ADDRESS_BOOK_NAME_MAX_LENGTH}
        />
      )}
    />
  )
}

/** Naming step shared by workspace onboarding and the "Add accounts" dialog; expects the surrounding form. */
const NameAccountsFields = ({ items }: { items: AllSafeItems }) => {
  const { getValues, setValue } = useFormContext<AddAccountsFormValues>()

  // Rebuilt rather than merged, so a Safe dropped from the step takes its name with it.
  useEffect(() => {
    const names: AddAccountsFormValues['names'] = {}
    for (const item of items) {
      names[item.address.toLowerCase()] = getValues(nameFieldKey(item.address)) ?? item.name ?? ''
    }
    setValue('names', names)
  }, [items, getValues, setValue])

  return (
    <NameAccountsFieldsView
      table={
        <SafeAccountsTable
          items={items}
          columns={COLUMNS}
          sortableColumns={false}
          renderName={(line: AccountLine) => <NameAccountCell address={line.address} />}
          data-testid="name-accounts-table"
        />
      }
    />
  )
}

export default NameAccountsFields
