import { UpdateSafeReview } from './UpdateSafeReview'
import SettingsIcon from '@/public/images/sidebar/settings.svg'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'

const UpdateSafeFlow = () => {
  return (
    <TxFlow
      subtitle="Update Safe Account version"
      icon={SettingsIcon}
      eventCategory={TxFlowType.UPDATE_SAFE}
      ReviewTransactionComponent={UpdateSafeReview}
    />
  )
}

export default UpdateSafeFlow
