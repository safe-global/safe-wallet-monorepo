import { ERROR_MSG } from '@/src/store/constants'
import { useAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback } from 'react'
import { useSiwe } from '@/src/hooks/useSiwe'

import Logger from '@/src/utils/logger'
import { HDNodeWallet, Wallet } from 'ethers'

export function useNotificationPayload() {
  const { data: nonceData } = useAuthGetNonceV1Query()
  const { createSiweMessage } = useSiwe()

  const getNotificationRegisterPayload = useCallback(
    async ({
      nonce,
      signer,
      chainId,
    }: {
      nonce: string | undefined
      signer: Wallet | HDNodeWallet
      chainId: string
    }) => {
      if (!nonce) {
        Logger.error('registerForNotifications: Missing required data', { nonce })
        throw new Error(ERROR_MSG)
      }

      if (!signer) {
        throw new Error('registerForNotifications: Signer account not found')
      }

      const siweMessage = createSiweMessage({
        address: signer.address,
        chainId: Number(chainId),
        nonce,
        statement: 'Safe Wallet wants you to sign in with your Ethereum account',
      })

      return {
        siweMessage,
      }
    },
    [nonceData],
  )

  return {
    getNotificationRegisterPayload,
  }
}
