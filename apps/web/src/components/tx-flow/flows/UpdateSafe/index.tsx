import { UpdateSafeReview } from './UpdateSafeReview'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { UPDATE_SAFE_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/UpdateSafe/copy'

const UpdateSafeFlow = () => {
  return (
    <TxFlow
      subtitle={COPY.subtitle}
      icon={SettingsIcon}
      eventCategory={TxFlowType.UPDATE_SAFE}
      ReviewTransactionComponent={UpdateSafeReview}
    />
  )
}

export default UpdateSafeFlow
