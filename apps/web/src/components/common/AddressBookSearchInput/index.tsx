import type { ReactElement } from 'react'

import SearchField from '@/components/common/SearchField'
import { cn } from '@/utils/cn'

interface AddressBookSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}

const AddressBookSearchInput = ({
  value,
  onChange,
  placeholder = 'Search for contacts',
  className,
  'aria-label': ariaLabel = 'Search contacts by name or address',
}: AddressBookSearchInputProps): ReactElement => {
  return (
    <SearchField
      className={cn('w-full sm:w-[320px]', className)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputClassName="dark:bg-white/10 hover:ring-1 hover:ring-ring"
    />
  )
}

export default AddressBookSearchInput
