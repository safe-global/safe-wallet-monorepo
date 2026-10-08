import { useAppDispatch } from '@/store'
import { openGlobalSearch } from '@/features/global-search/store'
import { GlobalSearchInputView } from '@views/features/global-search/components/GlobalSearchInput/GlobalSearchInputView'

interface GlobalSearchInputProps {
  className?: string
}

const GlobalSearchInput = ({ className }: GlobalSearchInputProps) => {
  const dispatch = useAppDispatch()

  return <GlobalSearchInputView buttonClassName={className} onOpen={() => dispatch(openGlobalSearch())} />
}

export default GlobalSearchInput
