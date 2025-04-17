import { useCallback } from 'react'
import { SiweMessage } from 'siwe'
import { HDNodeWallet, Wallet } from 'ethers'

interface SiweMessageProps {
  address: string
  chainId: number
  nonce: string
  statement: string
}

export function useSiwe() {
  const createSiweMessage = useCallback(({ address, chainId, nonce, statement }: SiweMessageProps) => {
    const message = new SiweMessage({
      address,
      chainId,
      domain: 'global.safe.mobileapp',
      statement,
      nonce,
      uri: 'https://safe.global',
      version: '1',
      issuedAt: new Date().toISOString(),
    })
    return message.prepareMessage()
  }, [])

  const signMessage = useCallback(async ({ signer, message }: { signer: Wallet | HDNodeWallet; message: string }) => {
    const signature = await signer.signMessage(message)
    return signature
  }, [])

  return {
    createSiweMessage,
    signMessage,
  }
}
