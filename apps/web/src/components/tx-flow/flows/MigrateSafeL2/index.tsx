import TxLayout from '@/components/tx-flow/common/TxLayout'
import { MigrateSafeL2Review } from './MigrateSafeL2Review'
import SettingsIcon from '@/public/images/sidebar/settings.svg'

const MigrateSafeL2Flow = () => {
  return (
    <TxLayout title="Confirm transaction" subtitle="Update Safe Account base contract" icon={SettingsIcon}>
      <MigrateSafeL2Review />
    </TxLayout>
  )
}

export default MigrateSafeL2Flow
