import Counterfactual from './Counterfactual'
import ComboSubmit from './ComboSubmit'
import Sign, { Sign as SignAction } from './Sign'
import Execute from './Execute'
import ExecuteThroughRole from './ExecuteThroughRole'
import Batching from './Batching'
import Propose from './Propose'
import { Slot, SlotName } from '../slots'

/**
 * TxActions bundles the transaction submit actions (sign / execute / execute-through-role /
 * batching / propose) together with the Submit slot that surfaces them.
 *
 * It is shared between the multi-step flow (ConfirmTxReceipt) and the single-screen flows so
 * the sign/execute path stays identical regardless of layout.
 */
export const TxActions = ({ onSubmit }: { onSubmit: () => void }) => (
  <>
    <Counterfactual />

    <ComboSubmit>
      <Sign />
      <Execute />
      <ExecuteThroughRole />
      <Batching />
    </ComboSubmit>

    <Propose />

    <Slot name={SlotName.Submit} onSubmitSuccess={onSubmit}>
      <SignAction
        onSubmitSuccess={onSubmit}
        options={[{ id: 'sign', label: 'Sign' }]}
        onChange={() => {}}
        slotId="sign"
      />
    </Slot>
  </>
)

export default TxActions
