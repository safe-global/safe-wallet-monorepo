import { useEffect, useRef } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useSwitchNetwork } from './useSwitchNetwork'
import Logger from '@/src/utils/logger'

/**
 * Keeps the WalletConnect wallet chain in sync with the active Safe's chain.
 *
 * When the user switches chains (activeSafe.chainId changes), this hook
 * automatically requests AppKit to switch the connected wallet's network.
 */
export function useChainSync() {
  const activeSafe = useAppSelector(selectActiveSafe)
  const { switchNetwork } = useSwitchNetwork()
  const prevChainIdRef = useRef(activeSafe?.chainId)

  useEffect(() => {
    const currentChainId = activeSafe?.chainId

    if (prevChainIdRef.current && currentChainId && prevChainIdRef.current !== currentChainId) {
      switchNetwork(currentChainId).catch((error) => {
        Logger.warn('Failed to sync wallet network after chain switch', error)
      })
    }

    prevChainIdRef.current = currentChainId
  }, [activeSafe?.chainId, switchNetwork])
}
