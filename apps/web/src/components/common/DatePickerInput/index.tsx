import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFormContext, Controller, type ControllerFieldState, type ControllerRenderProps } from 'react-hook-form'
import {
  addYears,
  endOfYear,
  format,
  isAfter,
  isBefore,
  isFuture,
  isValid,
  parse,
  startOfDay,
  startOfYear,
  subYears,
} from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  clearRange,
  DATE_DIGITS,
  EMPTY_SLOTS,
  slotAtTextIndex,
  slotsToText,
  textIndexAtSlot,
  textToSlots,
  writeDigits,
  type SlotState,
} from './slots'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

const DATE_FORMAT = 'dd/MM/yyyy'
const INVALID_DATE_ERROR = 'Invalid date'
const YEARS_SELECTABLE = 20

const toText = (value: Date | null) => (value && isValid(value) ? format(value, DATE_FORMAT) : '')

const SEGMENTED_DATE = /^(\d{1,2})\D(\d{1,2})\D(\d{1,4})$/

/**
 * Masks the entry to a `dd/MM/yyyy` prefix, capped at 8 digits so the year cannot grow past four. An
 * already-separated entry (a pasted `1/1/2036`) keeps its groups instead of becoming a digit stream.
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
 * Stands in for an entry that is not a real date yet. Living in the form value, not just local state,
 * is what makes react-hook-form hold the field invalid. Shared so its identity is stable per keystroke.
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

/** The window a date may fall in. Bounds the calendar's dropdowns and the typed entry alike. */
const getSelectableRange = (disableFuture: boolean, now = new Date()) => ({
  start: startOfYear(subYears(now, YEARS_SELECTABLE)),
  end: disableFuture ? now : endOfYear(addYears(now, YEARS_SELECTABLE)),
})

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

          // A seeded value (e.g. a date in the URL query) can arrive invalid
          if (!isValid(val)) {
            return INVALID_DATE_ERROR
          }

          // Compare days using `startOfDay` to ignore timezone offset
          if (disableFuture && isFuture(startOfDay(val))) {
            return 'Date cannot be in the future'
          }

          const { start, end } = getSelectableRange(disableFuture)
          if (isBefore(startOfDay(val), startOfDay(start)) || isAfter(startOfDay(val), startOfDay(end))) {
            return 'Date is out of range'
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
  const { trigger } = useFormContext()
  const value: Date | null = field.value ?? null
  const inputId = `${name}-date`
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [entry, setEntry] = useState<SlotState>(() => ({ slots: textToSlots(toText(value)), caret: 0 }))
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const text = slotsToText(entry.slots)

  const commit = (next: SlotState) => {
    setEntry(next)
    field.onChange(_fromText(slotsToText(next.slots)))
  }

  // Put the caret back where the edit left it. Rendering from slots replaces the whole value, which
  // would otherwise drop the caret at the end and make the next keystroke land in the wrong segment.
  useLayoutEffect(() => {
    const input = inputRef.current
    if (input && document.activeElement === input) {
      const at = textIndexAtSlot(entry.caret)
      input.setSelectionRange(at, at)
    }
  }, [entry])

  // A seeded value is never "touched", so react-hook-form holds the form invalid without filling in
  // the field's error: a disabled submit button and nothing explaining it. Validate once on mount.
  const hasSeededValue = useRef(value !== null)
  useEffect(() => {
    if (hasSeededValue.current) {
      trigger(name)
    }
  }, [name, trigger])

  // Resync only on a change from outside, so a half-typed entry is never reformatted under the cursor.
  useEffect(() => {
    setEntry((current) =>
      toKey(_fromText(slotsToText(current.slots))) === toKey(value)
        ? current
        : { slots: textToSlots(toText(value)), caret: 0 },
    )
  }, [value])

  // An empty field is never in error, and saying so explicitly drops a stale message: validation
  // from the blur that precedes a reset resolves after it.
  const isEmpty = text === '' && value === null

  // Don't nag about an entry that is simply unfinished until the user leaves the field.
  const digitCount = text.replace(/\D/g, '').length
  const isEntryUnfinished = digitCount > 0 && digitCount < DATE_DIGITS
  const errorMessage = isEmpty || (isEntryUnfinished && isFocused) ? undefined : fieldState.error?.message
  const hasError = !!errorMessage

  // Never hand the calendar an invalid date — react-day-picker formats it and throws
  const selectedDate = value && isValid(value) ? value : undefined

  // Bounds the dropdowns, so the nav arrows disable at the ends instead of paging into dead months.
  const { start: startMonth, end: endMonth } = useMemo(() => getSelectableRange(disableFuture), [disableFuture])

  // The same bound the validate rule uses, so the calendar can never offer a day it would reject.
  const disabledDays = useMemo(() => (disableFuture ? { after: endMonth } : undefined), [disableFuture, endMonth])

  // Every edit is a slot operation, so any segment of a complete date can be changed in place.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const from = slotAtTextIndex(input.selectionStart ?? 0)
    const to = slotAtTextIndex(input.selectionEnd ?? 0)
    const selection = to > from ? clearRange(entry.slots, from, to) : null

    if (/^\d$/.test(event.key)) {
      event.preventDefault()
      commit(writeDigits(selection?.slots ?? entry.slots, from, event.key))
      return
    }

    if (event.key === 'Backspace') {
      event.preventDefault()
      commit(selection ?? clearRange(entry.slots, Math.max(0, from - 1), from))
      return
    }

    if (event.key === 'Delete') {
      event.preventDefault()
      commit(selection ?? clearRange(entry.slots, from, from + 1))
    }
  }

  // Bulk input (paste, autofill, a mobile keyboard that fires no keydown) is normalised, then fills
  // the slots from the start. `_toMaskedText` is what reads a pasted `1/1/2036` as day, month, year.
  const handleReplace = (raw: string) => {
    const slots = raw === '' ? EMPTY_SLOTS : textToSlots(_toMaskedText(raw))
    commit({ slots, caret: raw === '' ? 0 : DATE_DIGITS })
  }

  const handleSelect = (date: Date | undefined) => {
    setEntry({ slots: textToSlots(toText(date ?? null)), caret: DATE_DIGITS })
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
            ref={(node) => {
              inputRef.current = node
              field.ref(node)
            }}
            value={text}
            placeholder="DD/MM/YYYY"
            autoComplete="off"
            inputMode="numeric"
            aria-invalid={hasError}
            onChange={(event) => handleReplace(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(event) => {
              event.preventDefault()
              handleReplace(event.clipboardData.getData('text'))
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false)
              field.onBlur()
            }}
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
            onSelect={handleSelect}
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

export default DatePickerInput
