import { useWeb3 } from '@/hooks/wallets/web3'
import { useAuthVerifyV1Mutation, useLazyAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback } from 'react'
import { getSignableMessage } from './utils'
import { logError } from '../exceptions'
import ErrorCodes from '../exceptions/ErrorCodes'

export const useSiwe = () => {
  const provider = useWeb3()
  const [fetchNonce] = useLazyAuthGetNonceV1Query()
  const [verifyAuthMutation] = useAuthVerifyV1Mutation()

  const signIn = useCallback(async () => {
    if (!provider) return

    try {
      const { data } = await fetchNonce()
      if (!data) return

      const [network, signer] = await Promise.all([provider.getNetwork(), provider.getSigner()])
      const signableMessage = getSignableMessage(signer.address, network.chainId, data.nonce)

      const signature = await signer.signMessage(signableMessage)

      return verifyAuthMutation({ siweDto: { message: signableMessage, signature } })
    } catch (error) {
      logError(ErrorCodes._640)
    }
  }, [fetchNonce, provider, verifyAuthMutation])

  return {
    signIn,
  }
}
