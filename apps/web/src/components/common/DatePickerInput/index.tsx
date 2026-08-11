import { useEffect, useState } from 'react'
import { useFormContext, Controller, type ControllerFieldState, type ControllerRenderProps } from 'react-hook-form'
import { format, isFuture, isValid, parse, startOfDay } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'

const DATE_FORMAT = 'dd/MM/yyyy'

const toText = (value: Date | null) => (value && isValid(value) ? format(value, DATE_FORMAT) : '')

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

          if (!isValid(val)) {
            return 'Invalid date'
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
  const hasError = !!fieldState.error
  const inputId = `${name}-date`
  const [text, setText] = useState(() => toText(value))

  // Reflect external value changes (calendar selection, form reset) without clobbering in-progress typing.
  useEffect(() => {
    setText((current) => {
      const next = toText(value)
      if (next) {
        return next
      }
      return value === null ? '' : current
    })
  }, [value])

  const handleTextChange = (raw: string) => {
    setText(raw)
    if (raw.trim() === '') {
      field.onChange(null)
      return
    }
    // Parse a complete dd/MM/yyyy string; an incomplete entry yields an Invalid Date that validation reports.
    field.onChange(parse(raw, DATE_FORMAT, new Date()))
  }

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={inputId} className={hasError ? 'text-destructive' : undefined}>
        {label}
      </FieldLabel>

      <Popover>
        <InputGroup inputSize="hero" variant="surface" aria-invalid={hasError}>
          <InputGroupInput
            id={inputId}
            name={field.name}
            ref={field.ref}
            value={text}
            placeholder="DD/MM/YYYY"
            autoComplete="off"
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

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            defaultMonth={value ?? undefined}
            onSelect={(date) => {
              setText(toText(date ?? null))
              field.onChange(date ?? null)
            }}
            disabled={disableFuture ? { after: new Date() } : undefined}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <FieldError>{fieldState.error?.message}</FieldError>
    </Field>
  )
}

export default DatePickerInput
