import { isSafeMessageListItem } from '@/utils/safe-message-guards'
import { useState, useEffect } from 'react'
import useSafeMessages from './useSafeMessages'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '../useSafeInfo'
import { fetchSafeMessage } from './useSyncSafeMessageSigner'
import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

const useSafeMessage = (safeMessageHash: string | undefined) => {
  const [safeMessage, setSafeMessage] = useState<MessageItem | undefined>()

  const { safe } = useSafeInfo()

  const messages = useSafeMessages()

  const ongoingMessage = messages.page?.results
    ?.filter(isSafeMessageListItem)
    .find((msg) => msg.messageHash === safeMessageHash)

  const [updatedMessage, messageError] = useAsync(async () => {
    if (!safeMessageHash) return
    return fetchSafeMessage(safeMessageHash, safe.chainId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeMessageHash, safe.chainId, safe.messagesTag])

  useEffect(() => {
    setSafeMessage(updatedMessage ?? ongoingMessage)
  }, [ongoingMessage, updatedMessage])

  return [safeMessage, setSafeMessage, messageError] as const
}

export default useSafeMessage
