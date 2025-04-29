import { useWeb3 } from '@/hooks/wallets/web3'
import { useAuthVerifyV1Mutation, useLazyAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback } from 'react'
import { getSignableMessage } from './utils'
import { logError } from '../exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import useWallet from '@/hooks/wallets/useWallet'
import { isPKWallet } from '@/utils/wallets'

export const useSiwe = () => {
  const wallet = useWallet()
  const provider = useWeb3()
  const [fetchNonce] = useLazyAuthGetNonceV1Query()
  const [verifyAuthMutation] = useAuthVerifyV1Mutation()

  const signIn = useCallback(async () => {
    if (!provider || !wallet) return

    try {
      const { data } = await fetchNonce()
      if (!data) return

      const [network, signer] = await Promise.all([provider.getNetwork(), provider.getSigner()])
      const signableMessage = getSignableMessage(signer.address, network.chainId, data.nonce)

      let signature
      // Using the signer.signMessage hexlifies the message which doesn't work with the personal_sign of the PK module
      if (isPKWallet(wallet)) {
        signature = await provider.send('personal_sign', [signableMessage, signer.address.toLowerCase()])
      } else {
        signature = await signer.signMessage(signableMessage)
      }

      return verifyAuthMutation({ siweDto: { message: signableMessage, signature } })
    } catch (error) {
      logError(ErrorCodes._640)
    }
  }, [fetchNonce, provider, verifyAuthMutation, wallet])

  return {
    signIn,
  }
}
