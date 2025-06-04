import { ERROR_MSG } from '@/src/store/constants'
import { useLazyAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback } from 'react'
import { useSiwe } from '@/src/hooks/useSiwe'

import Logger from '@/src/utils/logger'
import { HDNodeWallet, Wallet } from 'ethers'

export function useNotificationPayload() {
  const [getNonce] = useLazyAuthGetNonceV1Query()
  const { createSiweMessage } = useSiwe()

  const getNotificationRegisterPayload = useCallback(
    async ({ signer, chainId }: { signer: Wallet | HDNodeWallet; chainId: string }) => {
      const { data: nonceData } = await getNonce()
      if (!nonceData) {
        Logger.error('registerForNotifications: Failed to get nonce')
        throw new Error(ERROR_MSG)
      }

      if (!signer) {
        throw new Error('registerForNotifications: Signer account not found')
      }

      const siweMessage = createSiweMessage({
        address: signer.address,
        chainId: Number(chainId),
        nonce: nonceData.nonce,
        statement: 'Safe Wallet wants you to sign in with your Ethereum account',
      })

      return {
        siweMessage,
      }
    },
    [getNonce],
  )

  return {
    getNotificationRegisterPayload,
  }
}
