import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useIsExpiredSwap } from '@/features/swap'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import type { SyntheticEvent } from 'react'
import { useContext, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { isSignableBy } from '@/utils/transaction-guards'
import useWallet from '@/hooks/wallets/useWallet'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import CheckWallet from '@/components/common/CheckWallet'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmTxFlow } from '@/components/tx-flow/flows'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'

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
      {(isOk) => {
        const button = (
          <span>
            <Track {...TX_LIST_EVENTS.CONFIRM}>
              <Button
                onClick={onClick}
                variant={compact ? 'outline' : 'default'}
                disabled={!isOk || isDisabled}
                size={compact ? 'sm' : 'lg'}
              >
                Confirm
              </Button>
            </Track>
          </span>
        )

        return isOk && !isSignable && isSafeOwner ? (
          <Tooltip>
            <TooltipTrigger render={button} />
            <TooltipContent>You&apos;ve already signed this transaction</TooltipContent>
          </Tooltip>
        ) : (
          button
        )
      }}
    </CheckWallet>
  )
}

export default SignTxButton
