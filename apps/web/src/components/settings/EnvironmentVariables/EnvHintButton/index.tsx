import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { isEnvInitialState } from '@/store/settingsSlice'
import useChainId from '@/hooks/useChainId'
import { EnvHintButtonView } from '@views/components/settings/EnvironmentVariables/EnvHintButton/EnvHintButtonView'

type EnvHintButtonProps = {
  chainId?: string
  className?: string
}

const EnvHintButton = ({ chainId: chainIdProp, className }: EnvHintButtonProps = {}) => {
  const router = useRouter()
  const fallbackChainId = useChainId()
  const chainId = chainIdProp ?? fallbackChainId
  const isInitialState = useAppSelector((state) => isEnvInitialState(state, chainId))

  if (isInitialState) {
    return null
  }

  const navigate = () => {
    router.push({ pathname: AppRoutes.settings.environmentVariables, query: router.query })
  }

  return <EnvHintButtonView buttonClassName={className} onNavigate={navigate} />
}

export default EnvHintButton
