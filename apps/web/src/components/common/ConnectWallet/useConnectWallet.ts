import { useCallback } from 'react'
import useOnboard, { connectWallet } from '@/hooks/wallets/useOnboard'

const useConnectWallet = () => {
  const onboard = useOnboard()

  return useCallback(() => {
    if (!onboard) {
      console.warn('[ConnectWallet] Onboard instance is not initialized yet. Please wait for the app to finish loading.')
      console.warn('[ConnectWallet] This usually means chain configs are still loading. Check browser console for errors.')
      return Promise.resolve(undefined)
    }

    console.log('[ConnectWallet] Onboard instance found, attempting connection...')
    return connectWallet(onboard)
  }, [onboard])
}

export default useConnectWallet
