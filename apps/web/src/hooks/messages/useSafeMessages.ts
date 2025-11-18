import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import {
  useLazyMessagesGetMessagesBySafeV1Query,
  useMessagesGetMessagesBySafeV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/messages'

import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import { POLLING_INTERVAL } from '@/config/constants'

const useSafeMessages = (
  cursor?: string,
): {
  page?: MessagePage
  error?: string
  loading: boolean
} => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const [trigger, { data, error, isLoading }] = useLazyMessagesGetMessagesBySafeV1Query()

  // The latest page of messages is fetched via RTK Query
  const {
    currentData: messagesData,
    error: messagesError,
    isLoading: messagesLoading,
  } = useMessagesGetMessagesBySafeV1Query(
    {
      chainId: safe.chainId,
      safeAddress,
    },
    {
      skip: !safeAddress || !safe.chainId || !!cursor,
      pollingInterval: POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

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

  return cursor
    ? // New page
      {
        page: page ?? data,
        error: asyncError?.message ?? (error ? String(error) : undefined),
        loading: asyncLoading || isLoading,
      }
    : // Stored page
      {
        page: messagesData,
        error: messagesError ? (messagesError as any).error || 'Failed to load messages' : undefined,
        loading: messagesLoading,
      }
}

export default useSafeMessages
