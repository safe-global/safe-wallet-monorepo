import type { ReactElement, ReactNode } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeUnavailableMessage from '@/hooks/useSafeUnavailableMessage'
import { useUrlChain } from '@/hooks/useChainId'
import { SafeLoadingErrorView } from '@views/components/common/SafeLoadingError/SafeLoadingErrorView'

export {
  GENERIC_LOADING_ERROR,
  unsupportedNetworkError,
} from '@views/components/common/SafeLoadingError/SafeLoadingErrorView'

const SafeLoadingError = ({ children }: { children: ReactNode }): ReactElement => {
  const { safeError } = useSafeInfo()
  const unavailableMessage = useSafeUnavailableMessage()
  const urlChain = useUrlChain()

  if (urlChain.status === 'unknown')
    return <SafeLoadingErrorView error={{ kind: 'unsupportedNetwork', shortName: urlChain.shortName }} />

  if (!safeError) return <>{children}</>

  return <SafeLoadingErrorView error={{ kind: 'unavailable', message: unavailableMessage }} />
}

export default SafeLoadingError
