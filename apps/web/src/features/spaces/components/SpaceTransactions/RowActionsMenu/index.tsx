import type { ReactElement } from 'react'
import { MoreHorizontal } from 'lucide-react'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import CheckWallet from '@/components/common/CheckWallet'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import RejectTxFlow from '@/components/tx-flow/flows/RejectTx'
import useSetScopedTxFlow from '@/components/tx-flow/safe-scope/useSetScopedTxFlow'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'
import useIsPending from '@/hooks/useIsPending'
import useOrigin from '@/hooks/useOrigin'
import { useUrlSpaceId, withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
import { Errors, logError } from '@/services/exceptions'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getNonce } from '../utils'

export const getTxLink = (args: {
  origin: string
  chainShortName: string
  safeAddress: string
  txId: string
  spaceId: string | null
}): string =>
  args.origin +
  withSpaceIdInUrl(
    `${AppRoutes.transactions.tx}?safe=${args.chainShortName}:${args.safeAddress}&id=${args.txId}`,
    args.spaceId,
  )

const useTxLink = (txId: string): string | undefined => {
  const scope = useSafeScope()
  const chain = useChain(scope?.chainId ?? '')
  const spaceId = useUrlSpaceId()
  const origin = useOrigin()
  if (!scope || !chain) return undefined
  return getTxLink({ origin, chainShortName: chain.shortName, safeAddress: scope.safeAddress, txId, spaceId })
}

type RowActionsMenuProps = {
  tx: Transaction
  /** False when a rejection already holds this nonce */
  canReject: boolean
}

const RowActionsMenu = ({ tx, canReject }: RowActionsMenuProps): ReactElement => {
  const setTxFlow = useSetScopedTxFlow()
  const dispatch = useAppDispatch()
  const isPending = useIsPending(tx.id)
  const link = useTxLink(tx.id)
  const nonce = getNonce(tx)

  const copyLink = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      dispatch(showNotification({ message: 'Link copied', variant: 'success', groupKey: 'space-queue-copy-link' }))
    } catch (error) {
      logError(Errors._110, error)
    }
  }

  return (
    <CheckWallet noTooltip>
      {(isOk) => {
        const canReplace = isOk && !isPending && nonce !== undefined
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost-muted" size="icon-sm" aria-label={`More actions for #${nonce ?? ''}`} />}
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!canReplace}
                onClick={() => nonce !== undefined && setTxFlow(<TokenTransferFlow txNonce={nonce} />)}
              >
                Replace with a transfer
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canReplace || !canReject}
                onClick={() => nonce !== undefined && setTxFlow(<RejectTxFlow txNonce={nonce} />)}
              >
                Reject
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!link} onClick={copyLink}>
                Copy link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }}
    </CheckWallet>
  )
}

export default RowActionsMenu
