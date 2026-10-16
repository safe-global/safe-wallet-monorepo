import type { BaseWallet } from 'ethers'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { isQueueServiceDelegateMessage, signDelegateTypedDataWithKey } from '@safe-global/utils/services/delegates'

export const signTypedData = async (wallet: BaseWallet, typedData: TypedData): Promise<string> => {
  if (isQueueServiceDelegateMessage(typedData)) {
    return signDelegateTypedDataWithKey(wallet.signingKey, typedData)
  }

  return wallet.signTypedData(
    typedData.domain,
    { [typedData.primaryType]: typedData.types[typedData.primaryType] },
    typedData.message,
  )
}
