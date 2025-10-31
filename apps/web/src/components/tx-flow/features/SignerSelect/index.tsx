import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SlotName, withSlot } from '../../slots'
import { SignerForm } from './SignerForm'
import { useWalletContext } from '@/hooks/wallets/useWallet'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { Box, Stack } from '@mui/material'

const useShouldRegisterSlot = () => {
  const { connectedWallet } = useWalletContext() ?? {}
  const isNestedOwner = useIsNestedSafeOwner()
  return !!connectedWallet && !!isNestedOwner
}

const SignerSelectSlot = withSlot({
  Component: () => {
    const { willExecute, txId } = useContext(TxFlowContext)
    return (
      <Stack gap={2} mt={3}>
        <SignerForm willExecute={willExecute} txId={txId} />
      </Stack>
    )
  },
  slotName: SlotName.Main,
  id: 'signerSelect',
  useSlotCondition: useShouldRegisterSlot,
})

export default SignerSelectSlot
