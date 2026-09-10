import * as React from 'react'
import { Search, XIcon } from 'lucide-react'

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { cn } from '@/utils/cn'

type SearchInputProps = Omit<React.ComponentProps<'input'>, 'type'> &
  Pick<React.ComponentProps<typeof InputGroup>, 'inputSize' | 'variant'> & {
    inputClassName?: string
    iconClassName?: string
    /** Replaces the native clear button, which cannot be recoloured. Needs a controlled `value`. */
    onClear?: () => void
  }

function SearchInput({
  className,
  inputClassName,
  iconClassName,
  inputSize,
  variant = 'search',
  onClear,
  ...props
}: SearchInputProps) {
  const showClear = Boolean(onClear) && Boolean(props.value)

  return (
    <InputGroup inputSize={inputSize} variant={variant} className={className}>
      <InputGroupAddon align="inline-start">
        <Search className={cn('size-4', iconClassName)} data-testid="search-icon" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        className={cn(onClear && '[&::-webkit-search-cancel-button]:hidden', inputClassName)}
        {...props}
      />
      {showClear && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="ghost"
            size="icon-xs"
            className="text-foreground"
            aria-label="Clear search"
            onClick={onClear}
            data-testid="search-clear"
          >
            <XIcon className="pointer-events-none size-4" strokeWidth={ICON_STROKE} />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export { SearchInput }
