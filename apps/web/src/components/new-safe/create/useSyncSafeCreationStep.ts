import { useEffect } from 'react'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create/index'
import useWallet from '@/hooks/wallets/useWallet'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useCurrentChain } from '@/hooks/useChains'

const useSyncSafeCreationStep = (setStep: StepRenderProps<NewSafeFormData>['setStep'], networks: Chain[]) => {
  const wallet = useWallet()
  const currentChain = useCurrentChain()

  useEffect(() => {
    // Jump to choose name and network step if there is no pending Safe or if the selected network does not match the connected network
    if (!wallet || (networks.length === 1 && currentChain?.chainId !== networks[0].chainId)) {
      setStep(0)
      return
    }
  }, [currentChain?.chainId, networks, setStep, wallet])
}

export default useSyncSafeCreationStep
