import { useEffect, useState } from 'react'
import get from 'lodash/get'
import { useFormContext, useWatch } from 'react-hook-form'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, NAME_MIN_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'
import { Typography } from '@/components/ui/typography'
import Identicon from '@/components/common/Identicon'
import NameInput from '@/components/common/NameInput'
import { FullAddress, HOVER_ACTION_CLASS, RenameButton } from '@/components/common/AccountRow'
import { SafeAccountsTable, type AccountLine, type SafeAccountColumnId } from '@/features/myAccounts'
import type { AllSafeItems } from '@/hooks/safes'
import type { AddAccountsFormValues } from '../../hooks/addAccounts.types'
import { nameFieldKey } from './utils'
import { validateContactName } from '../SpaceAddressBook/utils'
import { cn } from '@/utils/cn'

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
    <div className="flex items-center gap-3 py-2">
      <span className="flex w-10 shrink-0 items-center">
        <Identicon address={address} />
      </span>
      <div
        className="flex min-w-0 flex-1 flex-col gap-0.5"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {showInput ? (
          <NameInput
            name={key}
            placeholder="Add a name"
            autoFocus={focused}
            validateCharset
            minLength={NAME_MIN_LENGTH}
            maxLength={ADDRESS_BOOK_NAME_MAX_LENGTH}
            className="-mx-1.5 w-[calc(100%+0.75rem)] [&_[data-slot=field-error]]:hidden"
            InputProps={{
              className: cn(
                'h-6 w-0 min-w-full rounded-sm px-1.5 py-0 text-base font-semibold md:text-base',
                error && 'border-destructive',
              ),
            }}
            data-testid="account-name-input"
          />
        ) : (
          <div className="flex h-6 items-center gap-1">
            <button
              type="button"
              onClick={startEditing}
              className="-mx-2 min-w-0 cursor-text truncate rounded-sm px-2 text-left text-base leading-6 font-semibold group-hover/row:bg-muted"
              data-testid="account-name-text"
            >
              {value}
            </button>
            <RenameButton onRename={startEditing} className={HOVER_ACTION_CLASS} />
          </div>
        )}
        {error ? (
          <Typography variant="paragraph-mini" className="text-destructive" role="alert">
            {error}
          </Typography>
        ) : (
          <FullAddress address={address} />
        )}
      </div>
    </div>
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
    <div className="flex flex-col gap-4">
      <Typography variant="paragraph" color="muted">
        Everyone on the Workspace can see these names. It is stored in the Workspace address book.
      </Typography>

      <SafeAccountsTable
        items={items}
        columns={COLUMNS}
        sortableColumns={false}
        renderName={(line: AccountLine) => <NameAccountCell address={line.address} />}
        data-testid="name-accounts-table"
      />
    </div>
  )
}

export default NameAccountsFields
