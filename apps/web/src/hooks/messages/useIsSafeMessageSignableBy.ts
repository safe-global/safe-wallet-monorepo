import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

import useIsSafeOwner from '@/hooks/useIsSafeOwner'

const useIsSafeMessageSignableBy = (message: MessageItem, walletAddress: string): boolean => {
  const isSafeOwner = useIsSafeOwner()
  return isSafeOwner && message.confirmations.every(({ owner }) => owner.value !== walletAddress)
}

export default useIsSafeMessageSignableBy
