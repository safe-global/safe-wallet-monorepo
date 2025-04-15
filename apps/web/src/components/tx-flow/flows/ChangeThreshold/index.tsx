import SaveAddressIcon from '@/public/images/common/save-address.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChooseThreshold } from './ChooseThreshold'
import { SETTINGS_EVENTS, trackEvent, TxFlowType } from '@/services/analytics'
import { type SubmitCallbackWithData, TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'

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
    >
      <TxFlowStep title="New transaction">
        <ChooseThreshold key={0} />
      </TxFlowStep>
    </TxFlow>
  )
}

export default ChangeThresholdFlow
