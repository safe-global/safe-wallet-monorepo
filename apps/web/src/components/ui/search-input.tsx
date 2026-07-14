import * as React from 'react'
import { Search } from 'lucide-react'

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/utils/cn'

type SearchInputProps = Omit<React.ComponentProps<'input'>, 'type'> &
  Pick<React.ComponentProps<typeof InputGroup>, 'inputSize' | 'variant'> & {
    inputClassName?: string
    iconClassName?: string
  }

function SearchInput({
  className,
  inputClassName,
  iconClassName,
  inputSize,
  variant = 'surface',
  ...props
}: SearchInputProps) {
  return (
    <InputGroup inputSize={inputSize} variant={variant} className={className}>
      <InputGroupAddon align="inline-start">
        <Search className={cn('size-4', iconClassName)} data-testid="search-icon" />
      </InputGroupAddon>
      <InputGroupInput type="search" className={inputClassName} {...props} />
    </InputGroup>
  )
}

export { SearchInput }
