import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { OwnerList } from '@/components/tx-flow/common/OwnerList'
import { Typography } from '@/components/ui/typography'

export type RemoveRecoveryFlowReviewViewProps = {
  recoverers: string[]
  renderOwnerList: (props: ComponentProps<typeof OwnerList>) => ReactNode
}

export function RemoveRecoveryFlowReviewView({
  recoverers,
  renderOwnerList,
}: RemoveRecoveryFlowReviewViewProps): ReactElement {
  return (
    <>
      <Typography>
        This transaction will remove the recovery module from your Safe account. You will no longer be able to recover
        your Safe account once this transaction is executed.
      </Typography>

      {renderOwnerList({
        title: 'Removing Recoverer',
        owners: recoverers.map((recoverer) => ({ value: recoverer })),
        className: 'bg-[var(--color-warning-background)]',
      })}
    </>
  )
}
