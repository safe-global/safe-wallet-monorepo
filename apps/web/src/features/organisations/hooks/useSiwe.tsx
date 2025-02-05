import { useWeb3 } from '@/hooks/wallets/web3'
import { useAuthGetNonceV1Query, useAuthVerifyV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback } from 'react'

export const useSiwe = () => {
  const provider = useWeb3()
  const { refetch: fetchNonce } = useAuthGetNonceV1Query()
  const [verifyAuthMutation] = useAuthVerifyV1Mutation()

  const getSignableMessage = (address: string, chainId: bigint, nonce: string) => {
    const message = {
      domain: window.location.host,
      address,
      // Results in special signing window in MetaMask
      statement:
        'By signing, you are agreeing to store this data on the Safe Cloud. This does not initiate a transaction or cost any fees.',
      uri: window.location.origin,
      version: '1',
      chainId: Number(chainId),
      nonce,
      issuedAt: new Date(),
    }
    const signableMessage = `${message.domain} wants you to sign in with your Ethereum account:
${message.address}

${message.statement}

URI: ${message.uri}
Version: ${message.version}
Chain ID: ${message.chainId}
Nonce: ${message.nonce}
Issued At: ${message.issuedAt.toISOString()}`

    return signableMessage
  }

  const signIn = useCallback(async () => {
    if (!provider) return

    const { data } = await fetchNonce()
    if (!data) return

    const [network, signer] = await Promise.all([provider.getNetwork(), provider.getSigner()])
    const signableMessage = getSignableMessage(signer.address, network.chainId, data.nonce)

    const signature = await signer.signMessage(signableMessage)

    // todo: is it possible to remove the dto wrapper?
    return verifyAuthMutation({ siweDto: { message: signableMessage, signature } })
  }, [fetchNonce, provider, verifyAuthMutation])

  return {
    signIn,
  }
}
