import type * as React from 'react'
import { cleanInputValue, parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { Input } from '@safe-global/views/components/ui/input'

type AddressPasteInputProps = React.ComponentProps<typeof Input>

const stripChainPrefix = (value: string): string => parsePrefixedAddress(cleanInputValue(value)).address

/** An `Input` that drops the chain prefix (`eth:0x…` → `0x…`) from pasted addresses. */
const AddressPasteInput = ({ onPaste, ...props }: AddressPasteInputProps) => {
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const stripped = stripChainPrefix(e.clipboardData.getData('text'))
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    nativeInputValueSetter?.call(e.currentTarget, stripped)
    e.currentTarget.dispatchEvent(new Event('input', { bubbles: true }))
    onPaste?.(e)
  }

  return <Input {...props} onPaste={handlePaste} />
}

export default AddressPasteInput
