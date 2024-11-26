import { useAppKit } from '@reown/appkit/react'
import { useCallback } from 'react'

const useConnectWallet = () => {
  const { open } = useAppKit()

  return useCallback(() => {
    return open
  }, [open])
}

export default useConnectWallet
