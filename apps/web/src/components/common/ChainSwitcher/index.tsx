import type { ReactElement } from 'react'
import { useCallback, useState } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCurrentChain } from '@/hooks/useChains'
import useOnboard from '@/hooks/wallets/useOnboard'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { switchWalletChain } from '@/services/tx/tx-sender/sdk'

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
    <Button
      onClick={handleChainSwitch}
      variant={primaryCta ? 'default' : 'outline'}
      className={cn('min-w-[200px]', fullWidth && 'w-full')}
      size={primaryCta ? 'default' : 'sm'}
      disabled={loading}
    >
      {loading ? (
        <Spinner className="size-5" />
      ) : (
        <>
          <span className="whitespace-nowrap">Switch to&nbsp;</span>
          <img
            src={chain?.chainLogoUri ?? undefined}
            alt={`${chain?.chainName} Logo`}
            width={24}
            height={24}
            loading="lazy"
          />
          <span className="whitespace-nowrap">&nbsp;{chain?.chainName}</span>
        </>
      )}
    </Button>
  )
}

export default ChainSwitcher
