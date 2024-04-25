import { useCallback } from 'react'

import { usePrivy } from '@privy-io/react-auth'

const useConnectWallet = () => {
  const { login, ready } = usePrivy()

  return useCallback(() => {
    if (!ready) return Promise.resolve(undefined)
    return login
  }, [login, ready])
}

export default useConnectWallet
