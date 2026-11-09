import { useContext, type ReactElement, type ReactNode } from 'react'
import { useGasPayerSelection, useIsFeeCardSlotVisible } from '@/features/fee-payment'
import { SafeTxContext } from './SafeTxProvider'
import { FeePayerContext } from './FeePayerContext'

/** Computes the sign step's fee payer once per flow and shares it through `FeePayerContext`. */
const FeePayerProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const { safeTx } = useContext(SafeTxContext)
  // While an execute form owns the fees there is no sign-step card, so nothing is quoted or estimated here.
  const isFeeCardShown = useIsFeeCardSlotVisible()
  const selection = useGasPayerSelection({ safeTx: isFeeCardShown ? safeTx : undefined, offer: null, step: 'sign' })

  return <FeePayerContext.Provider value={selection}>{children}</FeePayerContext.Provider>
}

export default FeePayerProvider
