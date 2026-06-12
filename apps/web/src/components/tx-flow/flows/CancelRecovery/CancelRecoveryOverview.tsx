import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import css from './styles.module.css'

import ReplaceTxIcon from '@/public/images/transactions/replace-tx.svg'
import { TxModalContext } from '../..'
import TxCard from '../../common/TxCard'
import { TxFlowContext } from '../../TxFlowProvider'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'

export function CancelRecoveryOverview(): ReactElement {
  const { setTxFlow } = useContext(TxModalContext)
  const { onNext } = useContext(TxFlowContext)

  const onClose = () => {
    setTxFlow(undefined)
    trackEvent(RECOVERY_EVENTS.GO_BACK)
  }

  return (
    <TxCard>
      <div className="flex flex-col items-center md:p-10">
        {/* TODO: Replace with correct icon when provided */}
        <ReplaceTxIcon />

        <Typography variant="h4" align="center" className="mt-10 mb-2">
          Do you want to cancel the Account recovery?
        </Typography>

        <Typography variant="paragraph-small" align="center" className="mb-6 block">
          If it is an unwanted recovery proposal or you&apos;ve noticed something suspicious, you can cancel it at any
          time.
        </Typography>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Button variant="outline" onClick={onClose} className={css.button} size="sm">
            Go back
          </Button>

          <Button size="sm" data-testid="cancel-proposal-btn" variant="default" onClick={onNext} className={css.button}>
            Yes, cancel proposal
          </Button>
        </div>
      </div>
    </TxCard>
  )
}
