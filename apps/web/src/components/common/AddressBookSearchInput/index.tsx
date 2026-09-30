import type { ComponentProps, ReactElement } from 'react'

import SearchField from '@/components/common/SearchField'
import { cn } from '@/utils/cn'

interface AddressBookSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
  /** Match the height of the buttons this search box shares a row with — `default` beside
   * `size="action"`/`submit`/`default` (h-9), `lg` only beside `size="lg"` (h-10). */
  inputSize?: ComponentProps<typeof SearchField>['inputSize']
}

const AddressBookSearchInput = ({
  value,
  onChange,
  placeholder = 'Search for contacts',
  className,
  inputSize,
  'aria-label': ariaLabel = 'Search contacts by name or address',
}: AddressBookSearchInputProps): ReactElement => {
  return (
    <SearchField
      className={cn('w-full sm:w-[320px]', className)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={value}
      inputSize={inputSize}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export default AddressBookSearchInput
