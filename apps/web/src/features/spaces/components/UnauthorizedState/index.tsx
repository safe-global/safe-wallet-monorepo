import { useDarkMode } from '@/hooks/useDarkMode'
import { UnauthorizedStateView } from '@views/features/spaces/components/UnauthorizedState/UnauthorizedStateView'

const UnauthorizedState = () => {
  const isDarkMode = useDarkMode()

  return <UnauthorizedStateView isDarkMode={isDarkMode} />
}

export default UnauthorizedState
