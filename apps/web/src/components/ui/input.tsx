import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cva, type VariantProps } from 'class-variance-authority'
import { cleanInputValue, parsePrefixedAddress } from '@safe-global/utils/utils/addresses'

import { cn } from '@/utils/cn'

/**
 * Heights mirror `Button`'s so a field and a button on the same row line up: `sm` (h-8) pairs with
 * `size="sm"`, `default` (h-9) with `size="default"` and SelectTrigger's default, `lg` (h-10) with
 * `size="lg"`/`"action"`/`"submit"`. `hero` (66px) is the tall Safe-creation / big-filter field.
 * Prefer `inputSize` over a hand-rolled `className="h-…"`. Border uses the shared `--border` token (not a
 * hard-coded gray). NB: `--input` is the field *fill* token, not a border colour — a visible field
 * border must use `border-border`, like AddressInput.
 *
 * Skins: `default` (`bg-input`) is the filled field — white in light mode, a translucent lift in dark
 * that works over any parent surface. `surface` (`bg-card`) is the opaque card-coloured fill; reach
 * for it only when translucency would show through (over images, gradients or coloured strips).
 */
const inputVariants = cva(
  'border-border border shadow-none focus-visible:ring-0 focus-visible:border-border aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-md py-1.5 text-base transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      // Named `inputSize` (not `size`) so it doesn't collide with the native numeric `size` attr
      // that callers spread through via `ComponentProps<'input'>`. SelectTrigger uses `size` freely
      // because its props have no native `size`.
      inputSize: {
        sm: 'h-8 px-3',
        default: 'h-9 px-3',
        lg: 'h-10 px-3',
        hero: 'h-[66px] min-h-[66px] rounded-[calc(var(--radius)-2px)] px-4',
      },
      variant: {
        default: 'bg-input',
        surface: 'bg-card dark:bg-card',
      },
    },
    defaultVariants: {
      inputSize: 'default',
      variant: 'default',
    },
  },
)

/**
 * Input Component
 *
 * Displays a form input field.
 *
 * @see https://ui.shadcn.com/docs/components/base/input
 *
 * @example
 * ```tsx
 * <Input type="email" placeholder="Email" />
 * ```
 *
 * @remarks
 * Key Props:
 * - `type`, `placeholder`, `disabled`, `className` — extends native input props, see Base UI
 */

const SCRIPT_TAG_REGEX = /<script[\s>][\s\S]*?(?:<\/script>|$)/gi
const EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi

const SCRIPT_INJECTION_ERROR = 'Scripts and event handlers are not allowed'

function containsScriptInjection(value: string): boolean {
  SCRIPT_TAG_REGEX.lastIndex = 0
  EVENT_HANDLER_REGEX.lastIndex = 0
  return SCRIPT_TAG_REGEX.test(value) || EVENT_HANDLER_REGEX.test(value)
}

function sanitizeInputValue(value: string): string {
  let previous: string
  let sanitized = value
  do {
    previous = sanitized
    SCRIPT_TAG_REGEX.lastIndex = 0
    EVENT_HANDLER_REGEX.lastIndex = 0
    sanitized = sanitized.replace(SCRIPT_TAG_REGEX, '').replace(EVENT_HANDLER_REGEX, '')
  } while (sanitized !== previous)
  return sanitized
}

function stripChainPrefix(value: string): string {
  const cleaned = cleanInputValue(value)
  const { address } = parsePrefixedAddress(cleaned)
  return address
}

function Input({
  className,
  type,
  inputSize,
  variant,
  onChange,
  onPaste,
  error,
  address,
  // Destructured so the `{...props}` spread below cannot overwrite the computed attribute: a caller
  // passing `aria-invalid={undefined}` (or `false`) alongside `error` would otherwise erase the
  // invalid state the error or the script-injection guard had set.
  'aria-invalid': ariaInvalid,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants> & { error?: string; address?: boolean }) {
  const [hasScriptInjection, setHasScriptInjection] = React.useState(false)

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const isInjection = containsScriptInjection(raw)
      setHasScriptInjection(isInjection)

      if (isInjection) {
        const sanitized = sanitizeInputValue(raw)
        e.target.value = sanitized
      }

      onChange?.(e)
    },
    [onChange],
  )

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (address) {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text')
        const stripped = stripChainPrefix(pasted)
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeInputValueSetter?.call(e.currentTarget, stripped)
        e.currentTarget.dispatchEvent(new Event('input', { bubbles: true }))
      }
      onPaste?.(e)
    },
    [address, onPaste],
  )

  return (
    <div className="w-full">
      <InputPrimitive
        type={type}
        data-slot="input"
        aria-invalid={hasScriptInjection || !!error || ariaInvalid || undefined}
        className={cn(inputVariants({ inputSize, variant }), className)}
        {...props}
        onChange={handleChange}
        onPaste={handlePaste}
      />
      {hasScriptInjection ? (
        <p role="alert" data-slot="field-error" className="mt-1 text-sm text-destructive">
          {SCRIPT_INJECTION_ERROR}
        </p>
      ) : error ? (
        <p role="alert" data-slot="field-error" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export { Input, sanitizeInputValue, containsScriptInjection, SCRIPT_INJECTION_ERROR }
