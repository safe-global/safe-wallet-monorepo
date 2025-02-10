import { useWeb3 } from '@/hooks/wallets/web3'
import { useAuthGetNonceV1Query, useAuthVerifyV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback } from 'react'
import { getSignableMessage } from './utils'

export const useSiwe = () => {
  const provider = useWeb3()
  const { refetch: fetchNonce } = useAuthGetNonceV1Query()
  const [verifyAuthMutation] = useAuthVerifyV1Mutation()

  const signIn = useCallback(async () => {
    if (!provider) return

    const { data } = await fetchNonce()
    if (!data) return

    const [network, signer] = await Promise.all([provider.getNetwork(), provider.getSigner()])
    const signableMessage = getSignableMessage(signer.address, network.chainId, data.nonce)

    const signature = await signer.signMessage(signableMessage)

    return verifyAuthMutation({ siweDto: { message: signableMessage, signature } })
  }, [fetchNonce, provider, verifyAuthMutation])

  return {
    signIn,
  }
}
