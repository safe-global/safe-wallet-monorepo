import { MigrateSafeL2Review } from './MigrateSafeL2Review'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { TxFlow } from '../../TxFlow'
import { MIGRATE_SAFE_L2_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/MigrateSafeL2/copy'

const MigrateSafeL2Flow = () => (
  <TxFlow icon={SettingsIcon} subtitle={COPY.subtitle} ReviewTransactionComponent={MigrateSafeL2Review} />
)

export default MigrateSafeL2Flow
