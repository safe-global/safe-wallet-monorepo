import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'

export type ReviewRemoveModuleViewProps = {
  address: string
  renderAddress: (props: EthHashInfoProps) => ReactNode
}

export const ReviewRemoveModuleView = ({ address, renderAddress }: ReviewRemoveModuleViewProps): ReactElement => (
  <>
    <Typography className="text-[var(--color-primary-light)]">Module</Typography>

    {renderAddress({ address, showCopyButton: true, hasExplorer: true, shortAddress: false })}

    <Typography className="my-4">
      After removing this module, any feature or app that uses this module might no longer work. If this Safe account
      requires more than one signature, the module removal will have to be confirmed by other signers as well.
    </Typography>
  </>
)
