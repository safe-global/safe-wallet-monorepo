import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'

export type ReviewRemoveGuardViewProps = {
  address: string
  renderAddress: (props: EthHashInfoProps) => ReactNode
}

export const ReviewRemoveGuardView = ({ address, renderAddress }: ReviewRemoveGuardViewProps): ReactElement => (
  <>
    <Typography className="text-[var(--color-primary-light)]">Transaction guard</Typography>

    {renderAddress({ address, showCopyButton: true, hasExplorer: true, shortAddress: false })}

    <Typography className="my-4">
      Once the transaction guard has been removed, checks by the transaction guard will not be conducted before or after
      any subsequent transactions.
    </Typography>
  </>
)
