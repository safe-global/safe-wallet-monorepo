import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '@/utils/cn'

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
  return value.replace(SCRIPT_TAG_REGEX, '').replace(EVENT_HANDLER_REGEX, '')
}

function Input({ className, type, onChange, error, ...props }: React.ComponentProps<'input'> & { error?: string }) {
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

  return (
    <div className="w-full">
      <InputPrimitive
        type={type}
        data-slot="input"
        aria-invalid={hasScriptInjection || !!error || props['aria-invalid'] || undefined}
        className={cn(
          'dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
        onChange={handleChange}
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
