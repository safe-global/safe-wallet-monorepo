import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useLazyMessagesGetMessagesBySafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

import { useAppSelector } from '@/store'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import { selectSafeMessages } from '@/store/safeMessagesSlice'

const useSafeMessages = (
  cursor?: string,
): {
  page?: MessagePage
  error?: string
  loading: boolean
} => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const [trigger, { data, error, isLoading }] = useLazyMessagesGetMessagesBySafeV1Query()

  // If cursor is passed, load a new messages page from the API
  const [page, asyncError, asyncLoading] = useAsync<MessagePage>(
    () => {
      if (!safeLoaded || !cursor) {
        return
      }
      return trigger({ chainId: safe.chainId, safeAddress, cursor }).then((result) => {
        if ('data' in result && result.data) {
          return result.data
        }
        throw new Error(String('error' in result ? result.error : 'Unknown error'))
      })
    },
    [safe.chainId, safeAddress, safeLoaded, cursor, trigger],
    false,
  )

  const messagesState = useAppSelector(selectSafeMessages)

  return cursor
    ? // New page
      {
        page: page ?? data,
        error: asyncError?.message ?? (error ? String(error) : undefined),
        loading: asyncLoading || isLoading,
      }
    : // Stored page
      {
        page: messagesState.data,
        error: messagesState.error,
        loading: messagesState.loading,
      }
}

export default useSafeMessages
