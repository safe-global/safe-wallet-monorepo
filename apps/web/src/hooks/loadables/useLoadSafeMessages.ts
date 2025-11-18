import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useEffect, useMemo } from 'react'
import { useMessagesGetMessagesBySafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

import { logError, Errors } from '@/services/exceptions'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export const useLoadSafeMessages = (): AsyncResult<MessagePage> => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const { messagesTag } = safe

  const skip = !safeLoaded || !safe.deployed

  const { data, error, isLoading, refetch } = useMessagesGetMessagesBySafeV1Query(
    { chainId: safe.chainId, safeAddress },
    { skip },
  )

  // Refetch when messagesTag changes
  useEffect(() => {
    if (!skip && messagesTag) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesTag])

  const emptyResult = useMemo(() => ({ results: [] }), [])
  const resultData = skip && !safe.deployed ? emptyResult : data

  useEffect(() => {
    if (error) {
      logError(Errors._608, String(error))
    }
  }, [error])

  return [resultData, error ? new Error(String(error)) : undefined, isLoading]
}

export default useLoadSafeMessages
