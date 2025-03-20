import { ERROR_MSG } from '@/src/store/constants'
import { useAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback } from 'react'
import { useSiwe } from '@/src/hooks/useSiwe'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { RootState } from '@/src/store'
import Logger from '@/src/utils/logger'
import { HDNodeWallet, Wallet } from 'ethers'

export function useNotificationPayload() {
  const { data: nonceData } = useAuthGetNonceV1Query()
  const { createSiweMessage } = useSiwe()
  const activeSafe = useDefinedActiveSafe()
  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))

  const getNotificationRegisterPayload = useCallback(
    async ({ nonce, signer }: { nonce: string | undefined; signer: Wallet | HDNodeWallet }) => {
      if (!activeSafe || !nonce) {
        Logger.error('registerForNotifications: Missing required data', { activeSafe, nonce })
        throw new Error(ERROR_MSG)
      }

      if (!signer) {
        throw new Error('registerForNotifications: Signer account not found')
      }

      const siweMessage = createSiweMessage({
        address: signer.address,
        chainId: Number(activeSafe.chainId),
        nonce,
        statement: 'Safe Wallet wants you to sign in with your Ethereum account',
      })

      return {
        siweMessage,
      }
    },
    [activeSafe, activeSafeInfo, nonceData],
  )

  return {
    getNotificationRegisterPayload,
  }
}
