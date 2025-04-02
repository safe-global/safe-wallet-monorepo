import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChooseThreshold } from './ChooseThreshold'
import { SETTINGS_EVENTS, trackEvent, TxFlowType } from '@/services/analytics'
import { type SubmitCallbackWithData, TxFlow } from '../../TxFlow'

export enum ChangeThresholdFlowFieldNames {
  threshold = 'threshold',
}

export type ChangeThresholdFlowProps = {
  [ChangeThresholdFlowFieldNames.threshold]: number
}

const ChangeThresholdFlow = () => {
  const {
    safe: { threshold, owners },
  } = useSafeInfo()

  const trackEvents = (newThreshold: number) => {
    trackEvent({ ...SETTINGS_EVENTS.SETUP.OWNERS, label: owners.length })
    trackEvent({ ...SETTINGS_EVENTS.SETUP.THRESHOLD, label: newThreshold })
  }

  const handleSubmit: SubmitCallbackWithData<ChangeThresholdFlowProps> = ({ data }) => {
    trackEvents(data?.threshold || threshold)
  }

  return (
    <TxFlow
      initialData={{ threshold }}
      icon={SaveAddressIcon}
      subtitle="Change threshold"
      onSubmit={handleSubmit}
      eventCategory={TxFlowType.CHANGE_THRESHOLD}
      showMethodCall
    >
      <ChooseThreshold key={0} />
    </TxFlow>
  )
}

export default ChangeThresholdFlow
