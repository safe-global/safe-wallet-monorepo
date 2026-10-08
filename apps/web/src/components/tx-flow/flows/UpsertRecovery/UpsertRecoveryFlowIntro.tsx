import type { ReactElement } from 'react'
import { useContext } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'
import { UpsertRecoveryFlowIntroView } from '@views/components/tx-flow/flows/UpsertRecovery/UpsertRecoveryFlowIntroView'

export function UpsertRecoveryFlowIntro(): ReactElement {
  const { onNext, data } = useContext(TxFlowContext)
  return <UpsertRecoveryFlowIntroView onNext={() => onNext(data)} />
}
