import { useCallback } from 'react'
import useOnboard, { connectWallet } from '@/hooks/wallets/useOnboard'

const useConnectWallet = () => {
  const onboard = useOnboard()

  return useCallback(() => {
    if (!onboard) {
      return Promise.resolve(undefined)
    }

    return connectWallet(onboard)
  }, [onboard])
}

export default useConnectWallet
