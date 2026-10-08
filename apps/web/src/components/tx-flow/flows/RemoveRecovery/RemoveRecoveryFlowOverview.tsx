import { useContext, type ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import type { RecoveryFlowProps } from '.'

import { TxFlowContext } from '../../TxFlowProvider'
import { RemoveRecoveryFlowOverviewView } from '@views/components/tx-flow/flows/RemoveRecovery/RemoveRecoveryFlowOverviewView'

export function RemoveRecoveryFlowOverview({ delayModifier }: RecoveryFlowProps): ReactElement {
  const { onNext } = useContext(TxFlowContext)
  return (
    <RemoveRecoveryFlowOverviewView
      recoverers={delayModifier.recoverers}
      renderAddress={(props) => <EthHashInfo {...props} />}
      onNext={onNext}
    />
  )
}
