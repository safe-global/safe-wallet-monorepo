import type { ReactElement } from 'react'
import { DrawerList, DrawerSection } from '@/components/common/Drawer'
import { AccountIdentity } from '../../../components/AccountIdentity'
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
