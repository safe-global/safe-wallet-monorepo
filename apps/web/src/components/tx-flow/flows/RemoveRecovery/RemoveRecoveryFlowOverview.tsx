import { useContext, type ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import TxCard from '../../common/TxCard'
import type { RecoveryFlowProps } from '.'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxFlowContext } from '../../TxFlowProvider'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function RemoveRecoveryFlowOverview({ delayModifier }: RecoveryFlowProps): ReactElement {
  const { onNext } = useContext(TxFlowContext)
  return (
    <TxCard>
      <Typography variant="paragraph-small" className="block">
        This transaction will remove the recovery module from your Safe account. You will no longer be able to recover
        your Safe account.
      </Typography>

      <Typography variant="paragraph-small" className="block">
        This Recoverer will not be able to initiate the recovery process once this transaction is executed.
      </Typography>

      <div data-testid="remove-recoverer-section">
        <Typography variant="paragraph-small" className="mb-2 block text-[var(--color-text-secondary)]">
          Removing Recoverer
        </Typography>

        {delayModifier.recoverers.map((recoverer) => (
          <EthHashInfo
            avatarSize={32}
            key={recoverer}
            shortAddress={false}
            address={recoverer}
            hasExplorer
            showCopyButton
          />
        ))}
      </div>

      <Separator className={commonCss.nestedDivider} />

      <div className="mt-0 flex items-center">
        <Button data-testid="next-btn" variant="default" onClick={onNext}>
          Next
        </Button>
      </div>
    </TxCard>
  )
}
