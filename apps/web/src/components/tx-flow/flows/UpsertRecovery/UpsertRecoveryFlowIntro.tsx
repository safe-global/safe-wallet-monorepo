import type { ReactElement } from 'react'

import TxCard from '../../common/TxCard'
import RecoveryRecoverers from '@/public/images/settings/spending-limit/beneficiary.svg'
import RecoveryRecoverer from '@/public/images/transactions/recovery-recoverer.svg'
import RecoveryDelay from '@/public/images/settings/spending-limit/time.svg'
import RecoveryExecution from '@/public/images/transactions/recovery-execution.svg'

import css from './styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { useContext } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const RecoverySteps = [
  {
    Icon: RecoveryRecoverers,
    title: 'Choose a Recoverer and set a review window',
    subtitle:
      'Only your chosen Recoverer can initiate the recovery process. The process can be cancelled at any time during the review window.',
  },
  {
    Icon: RecoveryRecoverer,
    title: 'Lost access? Let the Recoverer connect',
    subtitle: 'The recovery process can be initiated by a trusted Recoverer when connected to your Safe account.',
  },
  {
    Icon: RecoveryDelay,
    title: 'Start the recovery process',
    subtitle: 'Your Recoverer initiates the recovery process by proposing a new Safe account setup on-chain.',
  },
  {
    Icon: RecoveryExecution,
    title: 'All done! The Account is yours again',
    subtitle:
      'Once the review window has passed, you can execute the recovery proposal and regain access to your Safe account.',
  },
]

export function UpsertRecoveryFlowIntro(): ReactElement {
  const { onNext, data } = useContext(TxFlowContext)
  return (
    <TxCard>
      <div className={`${css.connector} flex flex-col gap-8`}>
        {RecoverySteps.map(({ Icon, title, subtitle }, index) => (
          <div key={index}>
            <div className="flex gap-6">
              <div className={css.icon}>
                <Icon />
              </div>
              <div className="flex-1">
                <Typography variant="h4" className="mb-1">
                  {title}
                </Typography>
                <Typography variant="paragraph-small" className="block">
                  {subtitle}
                </Typography>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Separator className={commonCss.nestedDivider} />
      <div className="flex items-center" style={{ marginTop: 'var(--space-1)' }}>
        <Button data-testid="next-btn" variant="default" onClick={() => onNext(data)}>
          Next
        </Button>
      </div>
    </TxCard>
  )
}
