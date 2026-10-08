import type { ChangeEventHandler, ComponentProps, ReactElement, ReactNode, RefCallback } from 'react'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/utils/cn'

export type NumberFieldViewProps = {
  label?: ReactNode
  error?: boolean
  helperText?: ReactNode
  fullWidth?: boolean
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  inputId?: string
  inputRef: RefCallback<HTMLInputElement>
  onChange: ChangeEventHandler<HTMLInputElement>
  inputClassName?: string
  /** Remaining native input props, spread last as before */
  inputProps: Omit<ComponentProps<'input'>, 'onChange' | 'className' | 'id' | 'ref'>
} & Pick<ComponentProps<typeof Input>, 'inputSize' | 'variant'>

export function NumberFieldView({
  label,
  error,
  helperText,
  fullWidth,
  startAdornment,
  endAdornment,
  inputId,
  inputRef,
  onChange,
  inputClassName,
  inputSize,
  variant,
  inputProps,
}: NumberFieldViewProps): ReactElement {
  const hasAdornment = Boolean(startAdornment || endAdornment)

  const control = hasAdornment ? (
    <InputGroup inputSize={inputSize} variant={variant} className={cn(fullWidth && 'w-full')}>
      {startAdornment && <InputGroupAddon align="inline-start">{startAdornment}</InputGroupAddon>}
      <InputGroupInput
        id={inputId}
        ref={inputRef}
        autoComplete="off"
        aria-invalid={error || undefined}
        className={inputClassName}
        onChange={onChange}
        {...inputProps}
      />
      {endAdornment && <InputGroupAddon align="inline-end">{endAdornment}</InputGroupAddon>}
    </InputGroup>
  ) : (
    <Input
      id={inputId}
      ref={inputRef}
      inputSize={inputSize}
      variant={variant}
      autoComplete="off"
      aria-invalid={error || undefined}
      className={cn(fullWidth && 'w-full', inputClassName)}
      onChange={onChange}
      {...inputProps}
    />
  )

  if (label == null && helperText == null) {
    return control
  }

  return (
    <Field data-invalid={error || undefined} className={cn(fullWidth && 'w-full')}>
      {label != null && (
        <FieldLabel htmlFor={inputId} className={error ? 'text-destructive' : undefined}>
          {label}
        </FieldLabel>
      )}
      {control}
      {helperText != null && (
        <FieldDescription className={error ? 'text-destructive' : undefined}>{helperText}</FieldDescription>
      )}
    </Field>
  )
}
