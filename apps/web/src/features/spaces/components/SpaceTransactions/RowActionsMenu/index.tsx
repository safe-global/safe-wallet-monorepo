import type { ReactElement } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { MoreHorizontal } from 'lucide-react'
import {
  useTransactionsGetTransactionByIdV1Query,
  type Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import CheckWallet from '@/components/common/CheckWallet'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import RejectTxFlow from '@/components/tx-flow/flows/RejectTx'
import { useIsNonceDeletable } from '@/components/tx-flow/flows/ReplaceTx'
import useSetScopedTxFlow from '@/components/tx-flow/safe-scope/useSetScopedTxFlow'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'
import useIsPending from '@/hooks/useIsPending'
import useOrigin from '@/hooks/useOrigin'
import useWallet from '@/hooks/wallets/useWallet'
import { useUrlSpaceId, withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
import { trackEvent } from '@/services/analytics'
import { REJECT_TX_EVENTS } from '@/services/analytics/events/reject-tx'
import { Errors, logError } from '@/services/exceptions'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { getNonce } from '../utils'
import { useOpenDeleteTxDialog } from './DeleteTxDialog'

export const DELETE_LABEL = 'Delete from queue'

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

const NOT_PROPOSER = 'Only the person who proposed it can delete it.'
const NOT_DELETABLE = 'Delete the later transactions first, or replace this one.'
const alreadyRejected = (nonce: number | undefined) =>
  `Transaction with nonce ${nonce} already has a reject transaction`

type DeleteState =
  | { status: 'hidden' }
  | { status: 'loading' }
  | { status: 'blocked'; reason: string }
  | { status: 'proposer'; safeTxHash: string }

const useDeleteState = (txId: string): DeleteState => {
  const scope = useSafeScope()
  const chain = useChain(scope?.chainId ?? '')
  const wallet = useWallet()
  const isDeleteEnabled = !!chain && hasFeature(chain, FEATURES.DELETE_TX)
  const { currentData } = useTransactionsGetTransactionByIdV1Query(
    scope && wallet && isDeleteEnabled ? { chainId: scope.chainId, id: txId } : skipToken,
  )
  if (!isDeleteEnabled) return { status: 'hidden' }
  if (!wallet) return { status: 'blocked', reason: NOT_PROPOSER }
  const executionInfo = currentData?.detailedExecutionInfo
  if (!currentData) return { status: 'loading' }
  if (!isMultisigDetailedExecutionInfo(executionInfo)) return { status: 'hidden' }
  const proposer = executionInfo.proposer?.value
  return proposer && sameAddress(wallet.address, proposer)
    ? { status: 'proposer', safeTxHash: executionInfo.safeTxHash }
    : { status: 'blocked', reason: NOT_PROPOSER }
}

// Disabled items ignore the pointer, so the wrapper holds the tooltip
const BlockedItem = ({ label, reason }: { label: string; reason?: string }): ReactElement => {
  const item = <DropdownMenuItem disabled>{label}</DropdownMenuItem>
  if (!reason) return item
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<div />}>{item}</TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs whitespace-normal">
        {reason}
      </TooltipContent>
    </Tooltip>
  )
}

const ProposerDeleteItem = ({ nonce, onDelete }: { nonce: number; onDelete: () => void }): ReactElement => {
  const isDeletable = useIsNonceDeletable(nonce)
  if (!isDeletable) return <BlockedItem label={DELETE_LABEL} reason={NOT_DELETABLE} />
  const onClick = () => {
    trackEvent(REJECT_TX_EVENTS.DELETE_OFFCHAIN_BUTTON)
    onDelete()
  }
  return <DropdownMenuItem onClick={onClick}>{DELETE_LABEL}</DropdownMenuItem>
}

/** Rendered only while the menu is open, so the details are fetched for the row being acted on */
const DeleteItem = ({ tx, onDelete }: { tx: Transaction; onDelete: (safeTxHash: string) => void }) => {
  const state = useDeleteState(tx.id)
  const nonce = getNonce(tx)
  if (state.status === 'hidden' || nonce === undefined) return null
  return (
    <>
      <DropdownMenuSeparator />
      {state.status === 'proposer' ? (
        <ProposerDeleteItem nonce={nonce} onDelete={() => onDelete(state.safeTxHash)} />
      ) : (
        <BlockedItem label={DELETE_LABEL} reason={state.status === 'blocked' ? state.reason : undefined} />
      )}
    </>
  )
}

type RowActionsMenuProps = {
  tx: Transaction
  /** False when a rejection already holds this nonce */
  canReject: boolean
}

const RowActionsMenu = ({ tx, canReject }: RowActionsMenuProps): ReactElement => {
  const setTxFlow = useSetScopedTxFlow()
  const scope = useSafeScope()
  const openDeleteDialog = useOpenDeleteTxDialog()
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
              render={<Button variant="ghost" size="icon-xs" aria-label={`More actions for #${nonce ?? ''}`} />}
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
              {canReject ? (
                <DropdownMenuItem
                  disabled={!canReplace}
                  onClick={() => nonce !== undefined && setTxFlow(<RejectTxFlow txNonce={nonce} />)}
                >
                  Reject
                </DropdownMenuItem>
              ) : (
                <BlockedItem label="Reject" reason={alreadyRejected(nonce)} />
              )}
              <DropdownMenuItem disabled={!link} onClick={copyLink}>
                Copy link
              </DropdownMenuItem>
              <DeleteItem
                tx={tx}
                onDelete={(safeTxHash) =>
                  scope && openDeleteDialog({ chainId: scope.chainId, safeAddress: scope.safeAddress, safeTxHash })
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }}
    </CheckWallet>
  )
}

export default RowActionsMenu
