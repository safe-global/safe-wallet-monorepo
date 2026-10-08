import LoadingSpinner, { SpinnerStatus } from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner'
import { SafeCreationEvent } from '@/features/counterfactual/services'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'
import { StatusMessageView } from '@views/components/new-safe/create/steps/StatusStep/StatusMessageView'

const StatusMessage = ({
  status,
  isError,
  pendingSafe,
}: {
  status: SafeCreationEvent
  isError: boolean
  pendingSafe: UndeployedSafe | undefined
}) => {
  const chain = useCurrentChain()

  const isSuccess = status === SafeCreationEvent.SUCCESS
  const spinnerStatus = isSuccess ? SpinnerStatus.SUCCESS : SpinnerStatus.PROCESSING
  const explorerLink =
    chain && pendingSafe?.status.txHash ? getBlockExplorerLink(chain, pendingSafe.status.txHash) : undefined

  return (
    <StatusMessageView
      status={status}
      isError={isError}
      spinner={<LoadingSpinner status={spinnerStatus} />}
      explorerHref={explorerLink?.href}
    />
  )
}

export default StatusMessage
