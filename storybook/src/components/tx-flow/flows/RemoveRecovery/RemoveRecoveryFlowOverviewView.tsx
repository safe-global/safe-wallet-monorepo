import { Fragment, type ReactElement, type ReactNode } from 'react'

import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export type RemoveRecoveryFlowOverviewViewProps = {
  recoverers: string[]
  renderAddress: (props: EthHashInfoProps) => ReactNode
  onNext: () => void
}

export function RemoveRecoveryFlowOverviewView({
  recoverers,
  renderAddress,
  onNext,
}: RemoveRecoveryFlowOverviewViewProps): ReactElement {
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

        {recoverers.map((recoverer) => (
          <Fragment key={recoverer}>
            {renderAddress({
              avatarSize: 32,
              shortAddress: false,
              address: recoverer,
              hasExplorer: true,
              showCopyButton: true,
            })}
          </Fragment>
        ))}
      </div>

      <Separator bleed="6" />

      <TxCardActions className="!mt-0">
        <Button data-testid="next-btn" variant="default" onClick={onNext}>
          Next
        </Button>
      </TxCardActions>
    </TxCard>
  )
}
