import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useIsExpiredSwap } from '@/features/swap'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import type { SyntheticEvent } from 'react'
import { useContext, type ReactElement } from 'react'

import { isSignableBy } from '@/utils/transaction-guards'
import useWallet from '@/hooks/wallets/useWallet'
import CheckWallet from '@/components/common/CheckWallet'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmTxFlow } from '@/components/tx-flow/flows'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { SignTxButtonView } from '@views/components/transactions/SignTxButton/SignTxButtonView'

const SignTxButton = ({ txSummary, compact = false }: { txSummary: Transaction; compact?: boolean }): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const wallet = useWallet()
  const nestedOwners = useNestedSafeOwners()
  const isSafeOwner = useIsSafeOwner()
  const isSignable =
    isSignableBy(txSummary, wallet?.address || '') || nestedOwners?.some((owner) => isSignableBy(txSummary, owner))
  const safeSDK = useSafeSDK()
  const expiredSwap = useIsExpiredSwap(txSummary.txInfo)
  const isDisabled = !isSignable || !safeSDK || expiredSwap

  const onClick = (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setTxFlow(<ConfirmTxFlow txSummary={txSummary} />, undefined, false)
  }

  return (
    <CheckWallet>
      {(isOk) => (
        <SignTxButtonView
          isOk={isOk}
          isSignable={!!isSignable}
          isSafeOwner={isSafeOwner}
          isDisabled={!!isDisabled}
          compact={compact}
          onClick={onClick}
        />
      )}
    </CheckWallet>
  )
}

export default SignTxButton
