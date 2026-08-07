import { useWeb3 } from '@/hooks/wallets/web3ReadOnly'
import { useAuthVerifyV1Mutation, useLazyAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback, useState } from 'react'
import { getSignableMessage } from './utils'
import { logError } from '../exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import useWallet from '@/hooks/wallets/useWallet'
import { isPKWallet } from '@/utils/wallets'

export const useSiwe = () => {
  const wallet = useWallet()
  const provider = useWeb3()
  const [loading, setLoading] = useState(false)

  const [fetchNonce] = useLazyAuthGetNonceV1Query()
  const [verifyAuthMutation] = useAuthVerifyV1Mutation()

  const signIn = useCallback(async () => {
    if (!wallet) return

    setLoading(true)

    try {
      // Prefer the chain-matched provider, but fall back to one built from the
      // wallet so sign-in works even when the wallet is connected to a chain
      // other than the current one — SIWE only needs a message signature.
      let signingProvider = provider
      if (!signingProvider) {
        const { createWeb3 } = await import('@/hooks/wallets/web3')
        signingProvider = createWeb3(wallet.provider)
      }

      const { data } = await fetchNonce()

      if (!data) {
        setLoading(false)
        return
      }

      const [network, signer] = await Promise.all([signingProvider.getNetwork(), signingProvider.getSigner()])
      const signableMessage = getSignableMessage(signer.address, network.chainId, data.nonce)

      let signature
      // Using the signer.signMessage hexlifies the message which doesn't work with the personal_sign of the PK module
      if (isPKWallet(wallet)) {
        signature = await signingProvider.send('personal_sign', [signableMessage, signer.address.toLowerCase()])
      } else {
        signature = await signer.signMessage(signableMessage)
      }

      setLoading(false)

      return verifyAuthMutation({ siweDto: { message: signableMessage, signature } })
    } catch (error) {
      setLoading(false)
      logError(ErrorCodes._640)
      throw error
    }
  }, [fetchNonce, provider, verifyAuthMutation, wallet])

  return {
    signIn,
    loading,
  }
}
