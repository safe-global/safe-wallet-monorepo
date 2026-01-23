import { MigrateSafeL2Review } from './MigrateSafeL2Review'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { TxFlow } from '@/features/tx-flow/components/TxFlow'

const MigrateSafeL2Flow = () => (
  <TxFlow
    icon={SettingsIcon}
    subtitle="Update Safe Account base contract"
    ReviewTransactionComponent={MigrateSafeL2Review}
  />
)

export default MigrateSafeL2Flow
