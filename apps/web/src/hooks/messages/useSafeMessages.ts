import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import {
  useLazyMessagesGetMessagesBySafeV1Query,
  useMessagesGetMessagesBySafeV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/messages'

import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'

const useSafeMessages = (
  cursor?: string,
): {
  page?: MessagePage
  error?: string
  loading: boolean
} => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()

  // For the first page (no cursor), use the regular query hook which caches automatically
  const skip = !safeLoaded || !safe.deployed || !!cursor
  const {
    currentData,
    error: queryError,
    isLoading: queryLoading,
  } = useMessagesGetMessagesBySafeV1Query({ chainId: safe.chainId, safeAddress }, { skip })

  // For pagination (with cursor), use lazy query
  const [trigger, { data: lazyData, error: lazyError, isLoading: lazyLoading }] =
    useLazyMessagesGetMessagesBySafeV1Query()

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
    ? // Paginated page with cursor
      {
        page: page ?? lazyData,
        error: asyncError?.message ?? (lazyError ? String(lazyError) : undefined),
        loading: asyncLoading || lazyLoading,
      }
    : // First page (cached by RTK Query)
      {
        page: currentData,
        error: queryError ? String(queryError) : undefined,
        loading: queryLoading,
      }
}

export default useSafeMessages
