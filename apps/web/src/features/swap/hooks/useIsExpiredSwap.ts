import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { useEffect, useRef, useState } from 'react'
import { isSwapOrderTxInfo } from '@/utils/transaction-guards'

// https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value
const MAX_TIMEOUT = 2147483647

function getExpiryDelay(expiryUnixTimestampSec: number): number {
  const currentTimeMs = Date.now()
  const expiryTimeMs = expiryUnixTimestampSec * 1000
  const timeUntilExpiry = expiryTimeMs - currentTimeMs

  if (timeUntilExpiry <= 0) {
    return 0 // Already expired
  }

  return Math.min(timeUntilExpiry, MAX_TIMEOUT)
}

/**
 * Checks whether a swap has expired and if it hasn't it sets a timeout
 * for the exact moment it will expire
 * @param txInfo
 */
const useIsExpiredSwap = (txInfo: TransactionInfo) => {
  const [isExpired, setIsExpired] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isSwapOrderTxInfo(txInfo)) return

    const delay = getExpiryDelay(txInfo.validUntil)

    if (delay === 0) {
      setIsExpired(true)
    } else {
      // Set a timeout for the exact moment it will expire
      timerRef.current = setTimeout(() => {
        setIsExpired(true)
      }, delay)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [txInfo])

  return isExpired
}

export default useIsExpiredSwap
