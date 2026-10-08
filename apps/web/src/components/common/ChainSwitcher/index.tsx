import type { ReactElement } from 'react'
import { useCallback, useState } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import useOnboard from '@/hooks/wallets/useOnboard'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { switchWalletChain } from '@/services/tx/tx-sender/sdk'
import { ChainSwitcherView } from '@views/components/common/ChainSwitcher/ChainSwitcherView'

const ChainSwitcher = ({
  fullWidth,
  primaryCta = false,
}: {
  fullWidth?: boolean
  primaryCta?: boolean
}): ReactElement | null => {
  const chain = useCurrentChain()
  const onboard = useOnboard()
  const isWrongChain = useIsWrongChain()
  const [loading, setIsLoading] = useState<boolean>(false)

  const handleChainSwitch = useCallback(async () => {
    if (!onboard || !chain) return
    setIsLoading(true)
    await switchWalletChain(onboard, chain.chainId)
    setIsLoading(false)
  }, [chain, onboard])

  if (!isWrongChain) return null

  return (
    <ChainSwitcherView
      chainName={chain?.chainName}
      chainLogoUri={chain?.chainLogoUri}
      loading={loading}
      onSwitch={handleChainSwitch}
      fullWidth={fullWidth}
      primaryCta={primaryCta}
    />
  )
}

export default ChainSwitcher
