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
    const { willExecute } = useContext(TxFlowContext)
    return <SignerForm willExecute={willExecute} />
  },
  slotName: SlotName.Feature,
  id: 'signerSelect',
  useSlotCondition: useShouldRegisterSlot,
})

export default SignerSelectSlot
