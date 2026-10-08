import type { ReactElement } from 'react'
import { DrawerList } from '@views/components/common/Drawer/components/DrawerList'
import { DrawerSection } from '@views/components/common/Drawer/components/DrawerSection'
import { AccountIdentity } from '@views/features/spaces/components/Policies/components/AccountIdentity'
import { formatSignedCount } from '@views/features/spaces/components/Policies/SpendingLimitDrawer/format'

export type PendingSignaturesProps = {
  safe: { address: string; name?: string }
  signed: number
  required: number
}

const PendingSignatures = ({ safe, signed, required }: PendingSignaturesProps): ReactElement => (
  <DrawerSection title="Pending signatures" rightNode={formatSignedCount(signed, required)}>
    <DrawerList items={[{ label: 'Safe account', content: <AccountIdentity {...safe} showCopyButton /> }]} />
  </DrawerSection>
)

export default PendingSignatures
