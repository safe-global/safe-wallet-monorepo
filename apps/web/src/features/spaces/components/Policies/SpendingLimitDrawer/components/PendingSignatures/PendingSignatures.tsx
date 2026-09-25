import type { ReactElement } from 'react'
import { DrawerList, DrawerSection } from '@/components/common/Drawer'
import { AccountIdentity } from '../../../components/AccountIdentity'
import { formatSignedCount } from '../../format'

export type PendingSignaturesProps = {
  safe: { address: string; name?: string }
  signed: number
  required: number
}

const PendingSignatures = ({ safe, signed, required }: PendingSignaturesProps): ReactElement => (
  <DrawerSection title="Pending signatures" rightNode={formatSignedCount(signed, required)}>
    <DrawerList items={[{ label: 'Safe account', content: <AccountIdentity {...safe} /> }]} />
  </DrawerSection>
)

export default PendingSignatures
