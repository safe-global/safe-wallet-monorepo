import type { ReactElement } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  useTransactionsGetTransactionByIdV1Query,
  type Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import RowActionsMenuView, {
  RowDeleteMenuItem,
  type TrackedRowAction,
} from '@safe-global/views/features/spaces/components/SpaceQueue/RowActionsMenuView'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { TokenTransferFlow } from '@/components/tx-flow/flows/TokenTransferFlow'
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
  if (!scope || !chain) {
    return undefined
  }
  return getTxLink({ origin, chainShortName: chain.shortName, safeAddress: scope.safeAddress, txId, spaceId })
}

const NOT_PROPOSER = 'Only the person who proposed it can delete it.'
const NOT_DELETABLE = 'Delete the later transactions first, or replace this one.'

const TRACKED_EVENTS: Record<TrackedRowAction, { category: string; action: string }> = {
  replace: REJECT_TX_EVENTS.REPLACE_TX_BUTTON,
  reject: REJECT_TX_EVENTS.REJECT_ONCHAIN_BUTTON,
}

const trackItem = (action: TrackedRowAction, item: ReactElement): ReactElement => (
  <Track {...TRACKED_EVENTS[action]} as="div">
    {item}
  </Track>
)

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
  if (!isDeleteEnabled) {
    return { status: 'hidden' }
  }
  if (!wallet) {
    return { status: 'blocked', reason: NOT_PROPOSER }
  }
  const executionInfo = currentData?.detailedExecutionInfo
  if (!currentData) {
    return { status: 'loading' }
  }
  if (!isMultisigDetailedExecutionInfo(executionInfo)) {
    return { status: 'hidden' }
  }
  const proposer = executionInfo.proposer?.value
  return proposer && sameAddress(wallet.address, proposer)
    ? { status: 'proposer', safeTxHash: executionInfo.safeTxHash }
    : { status: 'blocked', reason: NOT_PROPOSER }
}

const ProposerDeleteItem = ({ nonce, onDelete }: { nonce: number; onDelete: () => void }): ReactElement => {
  const isDeletable = useIsNonceDeletable(nonce)
  if (!isDeletable) {
    return <RowDeleteMenuItem disabledReason={NOT_DELETABLE} />
  }
  const onClick = () => {
    trackEvent(REJECT_TX_EVENTS.DELETE_OFFCHAIN_BUTTON)
    onDelete()
  }
  return <RowDeleteMenuItem onDelete={onClick} />
}

/** Rendered only while the menu is open, so the details are fetched for the row being acted on */
const DeleteItem = ({ tx, onDelete }: { tx: Transaction; onDelete: (safeTxHash: string) => void }) => {
  const state = useDeleteState(tx.id)
  const nonce = getNonce(tx)
  if (state.status === 'hidden' || nonce === undefined) {
    return null
  }
  if (state.status === 'proposer') {
    return <ProposerDeleteItem nonce={nonce} onDelete={() => onDelete(state.safeTxHash)} />
  }
  return <RowDeleteMenuItem disabledReason={state.status === 'blocked' ? state.reason : undefined} />
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
    if (!link) {
      return
    }
    try {
      await navigator.clipboard.writeText(link)
      dispatch(showNotification({ message: 'Link copied', variant: 'success', groupKey: 'space-queue-copy-link' }))
    } catch (error) {
      logError(Errors._110, error)
    }
  }

  const onDelete = (safeTxHash: string) =>
    scope && openDeleteDialog({ chainId: scope.chainId, safeAddress: scope.safeAddress, safeTxHash })

  return (
    <CheckWallet noTooltip>
      {(isOk) => {
        const canReplace = isOk && !isPending && nonce !== undefined
        return (
          <RowActionsMenuView
            nonce={nonce}
            canReplace={canReplace}
            canReject={canReplace && canReject}
            rejectDisabledReason={
              canReject ? undefined : `Transaction with nonce ${nonce} already has a reject transaction`
            }
            link={link}
            deleteItem={<DeleteItem tx={tx} onDelete={onDelete} />}
            onReplace={() => nonce !== undefined && setTxFlow(<TokenTransferFlow txNonce={nonce} />)}
            onReject={() => nonce !== undefined && setTxFlow(<RejectTxFlow txNonce={nonce} />)}
            onCopyLink={copyLink}
            wrapItem={trackItem}
          />
        )
      }}
    </CheckWallet>
  )
}

export default RowActionsMenu
