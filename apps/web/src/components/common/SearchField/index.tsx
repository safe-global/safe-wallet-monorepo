import type { ComponentProps, ReactElement } from 'react'

import { SearchInput } from '@/components/ui/search-input'
import { cn } from '@/utils/cn'

type SearchFieldProps = Omit<ComponentProps<'input'>, 'type'> & {
  className?: string
  inputClassName?: string
}

const SearchField = ({ className, inputClassName, ...props }: SearchFieldProps): ReactElement => {
  return (
    <div className={cn('relative', className)}>
      <SearchInput inputSize="lg" className={inputClassName} {...props} />
    </div>
  )
}

export default SearchField
