import { useCallback } from 'react'
import useWallet from '@/hooks/wallets/useWallet'
import { createWeb3 } from '@/hooks/wallets/web3'
import { isPKWallet } from '@/utils/wallets'
import { signPolicyUpdate, type SignedPolicyUpdate } from '../services/policyMessage'
import type { CloudCosignerPolicy } from '../types'

/**
 * Signs a policy update with the connected wallet. The private-key module needs the raw
 * `personal_sign` path because `signer.signMessage` hexlifies the message first.
 */
export const useSignPolicyUpdate = (): ((args: {
  chainId: string
  safeAddress: string
  policy: CloudCosignerPolicy
}) => Promise<SignedPolicyUpdate & { signer: string }>) => {
  const wallet = useWallet()

  return useCallback(
    async (args) => {
      if (!wallet) {
        throw new Error('No wallet connected')
      }
      const provider = createWeb3(wallet.provider)
      const signer = await provider.getSigner()
      const signMessage = (message: string): Promise<string> =>
        isPKWallet(wallet)
          ? provider.send('personal_sign', [message, signer.address.toLowerCase()])
          : signer.signMessage(message)
      const signed = await signPolicyUpdate({ ...args, signMessage })
      return { ...signed, signer: signer.address }
    },
    [wallet],
  )
}
