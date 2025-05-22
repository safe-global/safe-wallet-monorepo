import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useEffect } from 'react'
import { getSafeMessages } from '@safe-global/safe-gateway-typescript-sdk'

import useAsync from '@safe-global/utils/hooks/useAsync'
import { logError, Errors } from '@/services/exceptions'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export const useLoadSafeMessages = (): AsyncResult<MessagePage> => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()

  const [data, error, loading] = useAsync<MessagePage>(
    () => {
      if (!safeLoaded) return
      if (!safe.deployed) return Promise.resolve({ results: [] })

      return getSafeMessages(safe.chainId, safeAddress) as Promise<MessagePage>
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeLoaded, safe.chainId, safeAddress, safe.messagesTag, safe.deployed],
    false,
  )

  useEffect(() => {
    if (error) {
      logError(Errors._608, error.message)
    }
  }, [error])

  return [data, error, loading]
}

export default useLoadSafeMessages
