import type {
  ChangeEvent,
  ClipboardEvent,
  FocusEvent,
  KeyboardEvent,
  ReactElement,
  RefCallback,
  RefObject,
} from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

export type DatePickerInputViewProps = {
  inputId: string
  name: string
  label: string
  text: string
  hasError: boolean
  errorMessage?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  fieldRef: RefObject<HTMLDivElement | null>
  inputRef: RefCallback<HTMLInputElement>
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void
  onFocus: (event: FocusEvent<HTMLInputElement>) => void
  onBlur: (event: FocusEvent<HTMLInputElement>) => void
  startMonth: Date
  endMonth: Date
  selectedDate?: Date
  disabledDays?: { after: Date }
  onSelect: (date: Date | undefined) => void
}

export function DatePickerInputView({
  inputId,
  name,
  label,
  text,
  hasError,
  errorMessage,
  isOpen,
  onOpenChange,
  fieldRef,
  inputRef,
  onChange,
  onKeyDown,
  onPaste,
  onFocus,
  onBlur,
  startMonth,
  endMonth,
  selectedDate,
  disabledDays,
  onSelect,
}: DatePickerInputViewProps): ReactElement {
  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={inputId} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </FieldLabel>

      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <InputGroup ref={fieldRef} inputSize="hero" variant="surface" aria-invalid={hasError}>
          <InputGroupInput
            id={inputId}
            name={name}
            ref={inputRef}
            value={text}
            placeholder="DD/MM/YYYY"
            autoComplete="off"
            inputMode="numeric"
            aria-invalid={hasError}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <InputGroupAddon align="inline-end">
            <PopoverTrigger
              render={<InputGroupButton variant="ghost" size="icon-xs" aria-label={`Open ${label} calendar`} />}
            >
              <CalendarIcon className="size-4 text-muted-foreground" />
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>

        {/* Anchored to the field, not the icon button, so the calendar lines up with the input */}
        <PopoverContent className="w-auto p-0" align="start" anchor={fieldRef}>
          <Calendar
            mode="single"
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={onSelect}
            disabled={disabledDays}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {/* Fixed height: a message appearing must never move the field, or it eats the calendar click */}
      <div className="min-h-5">
        <FieldError>{errorMessage}</FieldError>
      </div>
    </Field>
  )
}
