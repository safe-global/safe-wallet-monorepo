import type { ReactElement } from 'react'
import { DrawerList } from '@safe-global/views/components/common/Drawer/components/DrawerList'
import { DrawerSection } from '@safe-global/views/components/common/Drawer/components/DrawerSection'
import AccountIdentity from '../../../components/AccountIdentity/AccountIdentity'
import { formatSignedCount } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/format'

export type PendingSignaturesProps = {
  safe: { address: string; name?: string }
  signed: number
  required: number
  timeToSign?: string
}

const PendingSignatures = ({ safe, signed, required, timeToSign }: PendingSignaturesProps): ReactElement => (
  <DrawerSection title="Pending signatures" rightNode={formatSignedCount(signed, required)}>
    <DrawerList
      items={[
        ...(timeToSign ? [{ label: 'Time to sign', content: timeToSign }] : []),
        { label: 'Safe account', content: <AccountIdentity {...safe} showCopyButton /> },
      ]}
    />
  </DrawerSection>
)

export default PendingSignatures
