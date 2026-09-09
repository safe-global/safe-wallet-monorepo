import * as React from 'react'
import { Search, XIcon } from 'lucide-react'

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { cn } from '@/utils/cn'

type SearchInputProps = Omit<React.ComponentProps<'input'>, 'type'> &
  Pick<React.ComponentProps<typeof InputGroup>, 'inputSize' | 'variant'> & {
    inputClassName?: string
    iconClassName?: string
    /**
     * Swaps the browser's native clear button for the design system's, shown only while `value` has
     * text. The native one takes the browser's accent colour and cannot be recoloured, so opt in
     * here rather than styling it. Needs a controlled `value` to know when to appear.
     */
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
            // text-foreground rather than black: it has to invert in dark mode.
            className="text-foreground"
            aria-label="Clear search"
            onClick={onClear}
            data-testid="search-clear"
          >
            {/* size-6 fills the 24px button and ICON_STROKE is 1.5, which together reproduce the
                13.5px glyph of the design system's Icon / x. The preset's default 16px svg at
                stroke 2 would draw it at roughly 9px instead. */}
            <XIcon className="pointer-events-none size-6" strokeWidth={ICON_STROKE} />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export { SearchInput }
