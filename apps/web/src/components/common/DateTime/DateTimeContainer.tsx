import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useTxFilter } from '@/utils/tx-history-filter'
import { DateTime } from '@views/components/common/DateTime/DateTime'

const DAYS_THRESHOLD = 60

/**
 * If queue, show relative time until threshold then show full date and time
 * If history, show time (as date labels are present)
 * If filter, show full date and time
 */

const DateTimeContainer = ({ value }: { value: number }): ReactElement => {
  const [filter] = useTxFilter()
  const router = useRouter()

  // (non-filtered) history is the endpoint that returns date labels
  const showTime = router.pathname === AppRoutes.transactions.history && !filter

  const isOld = Math.floor((Date.now() - value) / 1000 / 60 / 60 / 24) > DAYS_THRESHOLD

  return <DateTime value={value} showDateTime={isOld} showTime={showTime} />
}

export default DateTimeContainer
