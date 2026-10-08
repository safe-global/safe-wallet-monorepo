import { useIsMultichainSafe } from '../../hooks/useIsMultichainSafe'
import { useCurrentChain } from '@/hooks/useChains'
import { ChangeSignerSetupWarningView } from '@views/features/multichain/components/SignerSetupWarning/ChangeSignerSetupWarningView'

export const ChangeSignerSetupWarning = () => {
  const isMultichainSafe = useIsMultichainSafe()
  const currentChain = useCurrentChain()

  if (!isMultichainSafe) return

  return <ChangeSignerSetupWarningView chainName={currentChain?.chainName} />
}
