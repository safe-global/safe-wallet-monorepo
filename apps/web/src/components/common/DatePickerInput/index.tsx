import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext, Controller, type ControllerFieldState, type ControllerRenderProps } from 'react-hook-form'
import { format, isFuture, isValid, parse, startOfDay } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

const DATE_FORMAT = 'dd/MM/yyyy'
const DATE_DIGITS = 8
const INVALID_DATE_ERROR = 'Invalid date'

const toText = (value: Date | null) => (value && isValid(value) ? format(value, DATE_FORMAT) : '')

const SEGMENTED_DATE = /^(\d{1,2})\D(\d{1,2})\D(\d{1,4})$/

/**
 * Keeps the entry a well-formed `dd/MM/yyyy` prefix: digits only, separators inserted as the user
 * types, and never more than 8 digits — so a year cannot grow past four digits. An already-separated
 * entry (a pasted `1/1/2036`) keeps its groups, so a short day or month is not read as digits.
 */
export const _toMaskedText = (raw: string) => {
  const segments = raw.trim().match(SEGMENTED_DATE)

  if (segments) {
    const [, day, month, year] = segments
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
  }

  return raw
    .replace(/\D/g, '')
    .slice(0, DATE_DIGITS)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2')
}

/**
 * Stands in for an entry that is not a real date yet. Keeping it in the form value (rather than only
 * in local state) is what makes react-hook-form report the field as invalid, so a form cannot be
 * submitted while the user is looking at "Invalid date". Shared so the value identity stays stable
 * across keystrokes; nothing ever mutates it.
 */
const INVALID_DATE = new Date(NaN)

/**
 * A real date only comes out of a complete entry. Parsing a partial one would silently succeed with a
 * nonsense year, because date-fns' `yyyy` token matches a single digit (`2` becomes the year 0002).
 */
export const _fromText = (text: string): Date | null => {
  const digits = text.replace(/\D/g, '')

  if (digits.length === 0) {
    return null
  }

  if (digits.length < DATE_DIGITS) {
    return INVALID_DATE
  }

  const parsed = parse(text, DATE_FORMAT, new Date())
  return isValid(parsed) ? parsed : INVALID_DATE
}

/** Identity of a field value, so the input only resyncs on a change that came from outside it. */
const toKey = (value: Date | null) => {
  if (value === null) {
    return 'empty'
  }
  return isValid(value) ? String(value.getTime()) : 'invalid'
}

const DatePickerInput = ({
  name,
  label,
  deps,
  disableFuture = true,
  validate,
}: {
  name: string
  label: string
  deps?: string[]
  disableFuture?: boolean
  validate?: (value: Date | null) => string | undefined
}) => {
  const { control } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        deps,
        validate: (val) => {
          if (!val) {
            return
          }

          // Values seeded from outside the input (e.g. a date in the URL query) can be invalid
          if (!isValid(val)) {
            return INVALID_DATE_ERROR
          }

          // Compare days using `startOfDay` to ignore timezone offset
          if (disableFuture && isFuture(startOfDay(val))) {
            return 'Date cannot be in the future'
          }

          return validate?.(val)
        },
      }}
      render={({ field, fieldState }) => (
        <DatePickerField
          field={field}
          fieldState={fieldState}
          label={label}
          disableFuture={disableFuture}
          name={name}
        />
      )}
    />
  )
}

const DatePickerField = ({
  field,
  fieldState,
  label,
  disableFuture,
  name,
}: {
  field: ControllerRenderProps
  fieldState: ControllerFieldState
  label: string
  disableFuture: boolean
  name: string
}) => {
  const value: Date | null = field.value ?? null
  const inputId = `${name}-date`
  const fieldRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState(() => toText(value))
  const [isOpen, setIsOpen] = useState(false)

  // Resync only when the value changed outside the input (calendar pick, form reset), so a
  // half-typed entry is never reformatted under the cursor.
  useEffect(() => {
    setText((current) => (toKey(_fromText(current)) === toKey(value) ? current : toText(value)))
  }, [value])

  // Reported as soon as the entry stops being a date, never deferred to blur: revealing the message
  // later grows the field's block, and in a vertically centred dialog that moves the calendar button
  // between pointerdown and pointerup, so the click that opened it lands on nothing.
  //
  // An empty field is never in error (the rules skip empty values), and saying so explicitly drops a
  // stale message: validation started by the blur that precedes a reset resolves after it.
  const isEmpty = text === '' && value === null
  const errorMessage = isEmpty ? undefined : fieldState.error?.message
  const hasError = !!errorMessage

  // Never hand the calendar an invalid date — react-day-picker formats it and throws
  const selectedDate = value && isValid(value) ? value : undefined
  const disabledDays = useMemo(() => (disableFuture ? { after: startOfDay(new Date()) } : undefined), [disableFuture])

  const handleTextChange = (raw: string) => {
    const masked = _toMaskedText(raw)
    setText(masked)
    field.onChange(_fromText(masked))
  }

  const handleSelect = (date: Date | undefined) => {
    setText(toText(date ?? null))
    field.onChange(date ?? null)
    setIsOpen(false)
  }

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={inputId} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </FieldLabel>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <InputGroup ref={fieldRef} inputSize="hero" variant="surface" aria-invalid={hasError}>
          <InputGroupInput
            id={inputId}
            name={field.name}
            ref={field.ref}
            value={text}
            placeholder="DD/MM/YYYY"
            autoComplete="off"
            inputMode="numeric"
            aria-invalid={hasError}
            onChange={(event) => handleTextChange(event.target.value)}
            onBlur={field.onBlur}
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
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={handleSelect}
            disabled={disabledDays}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <FieldError>{errorMessage}</FieldError>
    </Field>
  )
}

export default DatePickerInput
