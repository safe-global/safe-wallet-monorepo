import * as React from 'react'
import { cleanInputValue, parsePrefixedAddress } from '@safe-global/utils/utils/addresses'

import { InputView, type InputViewProps } from '@views/components/ui/InputView'

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

type InputProps = Omit<InputViewProps, 'errorMessage' | 'invalid'> & {
  error?: string
  address?: boolean
  'aria-invalid'?: React.AriaAttributes['aria-invalid']
}

function Input({ onChange, onPaste, error, address, 'aria-invalid': ariaInvalid, ...props }: InputProps) {
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
    <InputView
      {...props}
      invalid={hasScriptInjection || !!error || Boolean(ariaInvalid) || undefined}
      errorMessage={hasScriptInjection ? SCRIPT_INJECTION_ERROR : error}
      onChange={handleChange}
      onPaste={handlePaste}
    />
  )
}

export { Input, sanitizeInputValue, containsScriptInjection, SCRIPT_INJECTION_ERROR }
export { inputVariants } from '@views/components/ui/InputView'
