import { useDarkMode } from '@/hooks/useDarkMode'
import { LoadingStateView } from '@views/features/spaces/components/LoadingState/LoadingStateView'

const LoadingState = () => {
  const isDarkMode = useDarkMode()

  return <LoadingStateView isDarkMode={isDarkMode} />
}

export default LoadingState
