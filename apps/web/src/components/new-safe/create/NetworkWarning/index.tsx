import { useCurrentChain } from '@/hooks/useChains'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { NetworkWarningView } from '@views/components/new-safe/create/NetworkWarning/NetworkWarningView'

const NetworkWarning = ({ action }: { action?: string }) => {
  const chain = useCurrentChain()
  const isWrongChain = useIsWrongChain()

  if (!chain || !isWrongChain) return null

  return <NetworkWarningView action={action} chainName={chain.chainName} chainSwitcher={<ChainSwitcher />} />
}

export default NetworkWarning
