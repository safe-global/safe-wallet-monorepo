import { ERROR_MSG, NOTIFICATION_ACCOUNT_TYPE } from '@/src/store/constants'
import { useAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useCallback } from 'react'
import { useSign } from '@/src/hooks/useSign'
import { useSiwe } from '@/src/hooks/useSiwe'
import { getSigner } from '@/src/utils/notifications'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { RootState } from '@/src/store'
import Logger from '@/src/utils/logger'
import { selectFCMToken } from '@/src/store/notificationsSlice'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export function useNotificationPayload(appSigners: Record<string, AddressInfo>) {
  const { data: nonceData } = useAuthGetNonceV1Query()
  const { getPrivateKey } = useSign()
  const { createSiweMessage } = useSiwe()
  const activeSafe = useDefinedActiveSafe()
  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
  const fcmToken = useAppSelector(selectFCMToken)

  const getNotificationRegisterPayload = useCallback(
    async ({
      nonce,
      ramdomPK
    }: {
      nonce: string | undefined;
      ramdomPK: string
    }) => {
      // 2. Construct payload to register for notifications
      // 2.1 - Get the nonce to be included in the SiWe as per
      // https://www.notion.so/safe-global/Authentication-implementation-f26c6040be5148748ac19655da5e4842
      if (!activeSafe || !fcmToken || !nonce || !ramdomPK) {
        Logger.error('registerForNotifications: Missing required data', { activeSafe, fcmToken, nonce, ramdomPK })
        throw new Error(ERROR_MSG)
      }

      // 2.1 - Verify if the subscriber is an owner or a regular/observer of the safe
      const ownerFound = activeSafeInfo.SafeInfo.owners.find((owner) => appSigners[owner.value]) || null
      const accountType = ownerFound ? NOTIFICATION_ACCOUNT_TYPE.OWNER : NOTIFICATION_ACCOUNT_TYPE.REGULAR

      // 2.2 - Retrieve the private key of the subscriber to be used as signer of the SiWe message
      const proposedSignerPK = ownerFound
        ? await getPrivateKey(ownerFound.value)
        : ramdomPK 

      const signer = proposedSignerPK && getSigner(proposedSignerPK)

      if (!signer) {
        throw new Error('registerForNotifications: Signer account not found')
      }

      // Step 3 - Create a message following the SIWE standard
      const siweMessage = createSiweMessage({
        address: signer.address,
        chainId: Number(activeSafe.chainId),
        nonce,
        statement: 'Safe Wallet wants you to sign in with your Ethereum account',
      })

      return {
        siweMessage,
        accountType,
        signer,
        fcmToken,
      }
    },
    [activeSafe, activeSafeInfo, fcmToken, nonceData],
  )

  return {
    getNotificationRegisterPayload,
  }
}
