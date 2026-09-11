import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SlotName, withSlot } from '../../slots'
import { SignerForm } from './SignerForm'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'

const useShouldRegisterSlot = () => {
  const { connectedWallet } = useWalletContext() ?? {}
  const isNestedOwner = useIsNestedSafeOwner()
  return !!connectedWallet && !!isNestedOwner
}

const SignerSelectSlot = withSlot({
  Component: () => {
    const { willExecute, txId } = useContext(TxFlowContext)
    return (
      <div className="mt-6 flex flex-col gap-4">
        <SignerForm willExecute={willExecute} txId={txId} />
      </div>
    )
  },
  slotName: SlotName.Main,
  id: 'signerSelect',
  useSlotCondition: useShouldRegisterSlot,
})

export default SignerSelectSlot
