import type { ComponentProps, FocusEvent, KeyboardEvent, ReactElement, ReactNode, Ref } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import type { UseFormRegisterReturn } from 'react-hook-form'
import classnames from 'classnames'
import CaretDownIcon from '@/public/images/common/caret-down.svg'
import SaveAddressIcon from '@/public/images/common/save-address.svg'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Field, FieldLabel } from '@/components/ui/field'
import css from './styles.module.css'

export type AddressInputChangeHandler = NonNullable<ComponentProps<typeof InputPrimitive>['onChange']>

export type AddressInputViewProps = {
  id: string
  fieldClassName?: string
  label?: ReactNode
  hasError: boolean
  errorMessage?: string
  /** ENS name the current address was resolved from. */
  resolvedFromName?: string
  isDomainLookupEnabled: boolean
  required: boolean
  disabled?: boolean
  placeholder?: string
  dataTestId?: string
  onWrapperBlur: (event: FocusEvent<HTMLDivElement>) => void
  isReadOnly: boolean
  readOnlyRef: Ref<HTMLDivElement>
  readOnlyContent?: ReactNode
  onReadOnlyClick: () => void
  onReadOnlyKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  startAdornment?: ReactNode
  /** Shown once a valid address is entered; a placeholder is shown until then. */
  identicon?: ReactNode
  showPrefixLabel: boolean
  shortName: string
  /** Arbitrary input attributes forwarded by the caller (role, aria-*, handlers). */
  forwardedProps: Record<string, unknown>
  registerProps: UseFormRegisterReturn
  inputRef: (node: HTMLInputElement | null) => void
  onInputChange: AddressInputChangeHandler
  autoFocus?: boolean
  readOnly?: boolean
  value?: string
  inputClassName?: string
  isBusy: boolean
  endAdornment?: ReactNode
  onAddressBookClick?: () => void
  onOpenListClick?: () => void
  isAutocompleteOpen?: boolean
}

export const AddressInputView = ({
  id,
  fieldClassName,
  label,
  hasError,
  errorMessage,
  resolvedFromName,
  isDomainLookupEnabled,
  required,
  disabled,
  placeholder,
  dataTestId,
  onWrapperBlur,
  isReadOnly,
  readOnlyRef,
  readOnlyContent,
  onReadOnlyClick,
  onReadOnlyKeyDown,
  startAdornment,
  identicon,
  showPrefixLabel,
  shortName,
  forwardedProps,
  registerProps,
  inputRef,
  onInputChange,
  autoFocus,
  readOnly,
  value,
  inputClassName,
  isBusy,
  endAdornment,
  onAddressBookClick,
  onOpenListClick,
  isAutocompleteOpen,
}: AddressInputViewProps): ReactElement => {
  const resolvedFromLabel = resolvedFromName ? `Address resolved from ${resolvedFromName}` : undefined

  const labelText =
    errorMessage || resolvedFromLabel || label || `Recipient address${isDomainLookupEnabled ? ' or ENS' : ''}`

  const resolvedPlaceholder = placeholder ?? (required ? undefined : 'Optional')

  return (
    <Field className={fieldClassName}>
      <FieldLabel htmlFor={id} className={hasError ? 'text-destructive' : undefined}>
        {labelText}
      </FieldLabel>

      <div
        data-testid={dataTestId}
        className={classnames(css.inputWrapper, { [css.error]: hasError, [css.readOnly]: isReadOnly })}
        onBlur={onWrapperBlur}
      >
        {isReadOnly ? (
          <div
            ref={readOnlyRef}
            className="min-w-0 flex-1 outline-none"
            role={disabled ? undefined : 'button'}
            tabIndex={disabled ? undefined : 0}
            onClick={disabled ? undefined : onReadOnlyClick}
            onKeyDown={disabled ? undefined : onReadOnlyKeyDown}
          >
            {readOnlyContent}
          </div>
        ) : (
          <div className={css.startAdornment}>
            {startAdornment}
            {identicon ?? <Skeleton className="size-8 rounded-full animate-none" />}
          </div>
        )}

        {/* The prefix span MUST remain the immediate previous sibling of the input */}
        {showPrefixLabel && <span className={css.prefix}>{shortName}:</span>}

        <InputPrimitive
          {...forwardedProps}
          {...registerProps}
          ref={inputRef}
          onChange={onInputChange}
          id={id}
          className={classnames(css.input, inputClassName)}
          autoComplete="off"
          autoFocus={autoFocus}
          spellCheck={false}
          disabled={disabled}
          required={required}
          placeholder={resolvedPlaceholder}
          readOnly={readOnly}
          aria-invalid={hasError || undefined}
          // Workaround for a bug in react-hook-form when `register().value` is cached after `setValueAs`
          // Only seems to occur on the `/load` route
          value={value}
        />

        <div className={css.endAdornment}>
          {isBusy ? (
            <Spinner role="progressbar" className="size-5" />
          ) : !disabled ? (
            <>
              {endAdornment}

              {onAddressBookClick && (
                <Button type="button" variant="ghost" size="icon-sm" onClick={onAddressBookClick}>
                  <SaveAddressIcon className="size-4 text-[var(--color-primary-main)]" />
                </Button>
              )}

              {onOpenListClick && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  data-testid="address-book-toggle"
                  // Arrow down on the input opens the list, so the caret is a redundant tab stop.
                  tabIndex={-1}
                  onClick={onOpenListClick}
                  className={classnames(css.openButton, { [css.rotated]: isAutocompleteOpen })}
                >
                  <CaretDownIcon className="size-4 text-[var(--color-primary-main)]" />
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </Field>
  )
}
