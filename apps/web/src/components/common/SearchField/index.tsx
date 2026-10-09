import type { ComponentProps, ReactElement } from 'react'

import { SearchInput } from '@safe-global/design/components/ui/search-input'
import { cn } from '@safe-global/design/utils/cn'

type SearchFieldProps = Omit<ComponentProps<'input'>, 'type'> &
  Pick<ComponentProps<typeof SearchInput>, 'inputSize' | 'variant'> & {
    className?: string
    inputClassName?: string
  }

const SearchField = ({ className, inputClassName, inputSize, variant, ...props }: SearchFieldProps): ReactElement => {
  return (
    <div className={cn('relative', className)}>
      <SearchInput className={inputClassName} inputSize={inputSize} variant={variant} {...props} />
    </div>
  )
}

export default SearchField
