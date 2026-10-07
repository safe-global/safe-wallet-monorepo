import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { flattenSafeItems } from '@/hooks/safes'
import { useChain } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { isSmartContractWallet } from '@/utils/wallets'
import { useSpaceSafes } from '../../../hooks/useSpaceSafes'

/** The flow signs as an EOA, so a wallet that is itself a Safe (e.g. a parent over WalletConnect) cannot grant here. */
export const useParentSafeWallet = (chainId: string | undefined): string | undefined => {
  const wallet = useWallet()
  const walletAddress = wallet?.address
  const { allSafes } = useSpaceSafes()
  const chain = useChain(chainId ?? '')
  const provider = useMemo(() => (chain ? createWeb3ReadOnly(chain) : undefined), [chain])

  const isSpaceSafe = useMemo(
    () =>
      !!chainId &&
      !!walletAddress &&
      flattenSafeItems(allSafes).some((item) => item.chainId === chainId && sameAddress(item.address, walletAddress)),
    [allSafes, chainId, walletAddress],
  )

  const [isContract] = useAsync(() => {
    if (!chainId || !walletAddress || !provider || isSpaceSafe) return
    return isSmartContractWallet(chainId, walletAddress, provider).catch(() => false)
  }, [chainId, walletAddress, provider, isSpaceSafe])

  return isSpaceSafe || isContract ? walletAddress : undefined
}
