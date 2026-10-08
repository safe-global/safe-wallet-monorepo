import { type ReactElement } from 'react'
import classnames from 'classnames'
import type { UseFormRegisterReturn } from 'react-hook-form'
import EthHashInfo from '@/components/common/EthHashInfo'
import Identicon from '@/components/common/Identicon'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Autocomplete, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import CaretDownIcon from '@/public/images/common/caret-down.svg'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

export type InviteeIdentifierOption = { address: string; name: string }

export type AddMemberInputViewProps = {
  error?: string
  inputProps: UseFormRegisterReturn<'inviteeIdentifier'>
  value: string
  maxLength: number
  options: InviteeIdentifierOption[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onToggleOpen: () => void
  showIdenticon: boolean
  showInitials: boolean
  initialsName: string
}

export const AddMemberInputView = ({
  error,
  inputProps,
  value,
  maxLength,
  options,
  isOpen,
  onOpenChange,
  onToggleOpen,
  showIdenticon,
  showInitials,
  initialsName,
}: AddMemberInputViewProps): ReactElement => {
  const renderAvatar = () => {
    if (showIdenticon) {
      return <Identicon address={value} size={32} />
    }
    if (showInitials) {
      return <InitialsAvatar name={initialsName} size="medium" rounded />
    }
    return <Skeleton className="size-8 rounded-full" />
  }

  const showOptions = options.length > 0

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="member-invitee-identifier-input" className={cn('gap-1', error && 'text-destructive')}>
        {error || 'Address, email or ENS'}
      </Label>

      <Autocomplete
        items={options}
        // Options are already searched/sliced via useAddressBookSearch.
        filter={() => true}
        itemToStringValue={(option: InviteeIdentifierOption) => option.address}
        value={value}
        onValueChange={(newValue, details) => {
          // 'input-change' = typing; 'item-press' = a suggestion filling in its address
          if (details.reason === 'input-change' || details.reason === 'item-press') {
            inputProps.onChange({ target: { name: inputProps.name, value: newValue } })
          }
        }}
        open={isOpen && showOptions}
        onOpenChange={onOpenChange}
        openOnInputClick
        inputRef={inputProps.ref}
      >
        <ComboboxInput
          id="member-invitee-identifier-input"
          className="min-h-[66px]"
          name={inputProps.name}
          aria-invalid={!!error}
          autoComplete="off"
          spellCheck={false}
          maxLength={maxLength}
          showTrigger={false}
          onBlur={inputProps.onBlur}
          data-testid="member-invitee-identifier-input"
        >
          <InputGroupAddon align="inline-start">{renderAvatar()}</InputGroupAddon>
          {showOptions && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                tabIndex={-1}
                aria-label="Toggle suggestions"
                className={classnames(css.openButton, { [css.rotated]: isOpen })}
                onClick={onToggleOpen}
              >
                <CaretDownIcon className="size-4 text-[var(--color-primary-main)]" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </ComboboxInput>

        <ComboboxContent>
          <ComboboxList>
            {(option: InviteeIdentifierOption) => (
              <ComboboxItem key={option.address} value={option}>
                <EthHashInfo address={option.address} name={option.name} shortAddress={false} copyAddress={false} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Autocomplete>
    </div>
  )
}
