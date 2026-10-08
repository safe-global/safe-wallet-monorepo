import type { ReactElement } from 'react'
import { useState } from 'react'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { getProposerErrorText } from '@/features/proposers/utils/proposerErrors'
import CopyTooltip from '@/components/common/CopyTooltip'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { signProposerTypedDataForSafe } from '@/features/proposers/utils/utils'
import { confirmDelegationMessage } from '../services/delegationMessages'
import { useSubmitDelegation } from '../hooks/useSubmitDelegation'
import { getTotpExpirationDate } from '@/features/proposers/utils/totp'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import useOrigin from '@/hooks/useOrigin'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { AppRoutes } from '@/config/routes'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { DelegateAction } from '@safe-global/utils/services/delegates'
import type { PendingDelegation as PendingDelegationType } from '@/features/proposers/types'
import { withSpaceIdInUrl, useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { PendingDelegationView } from '@views/features/proposers/components/PendingDelegationView'

const SIGNING_ACTION_BY_DELEGATION: Record<PendingDelegationType['action'], DelegateAction> = {
  add: 'add',
  remove: 'delete',
}

type PendingDelegationProps = {
  delegation: PendingDelegationType
  onRefetch: () => void
}

function PendingDelegation({ delegation, onRefetch }: PendingDelegationProps): ReactElement {
  const [isSignLoading, setIsSignLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const wallet = useWallet()
  const dispatch = useAppDispatch()
  const origin = useOrigin()
  const spaceId = useUrlSpaceId()
  const { submitDelegation, isSubmitting } = useSubmitDelegation()

  const hasAlreadySigned = delegation.confirmations.some((c) => sameAddress(c.owner.value, wallet?.address))
  const expirationDate = getTotpExpirationDate(delegation.totp)
  const remainingSeconds = Math.max(0, Math.floor((expirationDate.getTime() - Date.now()) / 1000))

  // Link to the parent safe's message page where other owners can sign
  const parentSafeId = chain?.shortName
    ? `${chain.shortName}:${delegation.parentSafeAddress}`
    : `${chainId}:${delegation.parentSafeAddress}`
  const shareUrl = origin
    ? withSpaceIdInUrl(
        `${origin}${AppRoutes.transactions.msg}?safe=${parentSafeId}&messageHash=${delegation.messageHash}`,
        spaceId,
      )
    : ''

  const handleSign = async () => {
    if (!wallet?.provider || !chain) return

    setError(undefined)
    setIsSignLoading(true)

    try {
      const signer = await getAssertedChainSigner(wallet.provider)

      const signingAction = SIGNING_ACTION_BY_DELEGATION[delegation.action]

      const eoaSignature = await signProposerTypedDataForSafe(
        chain,
        delegation.delegateAddress,
        delegation.parentSafeAddress,
        delegation.nestedSafeAddress,
        signingAction,
        signer,
      )

      await confirmDelegationMessage(dispatch, chainId, delegation.messageHash, eoaSignature)

      const newConfirmationsCount = delegation.confirmationsSubmitted + 1
      if (newConfirmationsCount >= delegation.confirmationsRequired) {
        onRefetch()
        dispatch(
          showNotification({
            variant: 'success',
            groupKey: 'delegation-threshold-met',
            title: 'Threshold met!',
            message: 'All required signatures have been collected. You can now submit the delegation.',
          }),
        )
      } else {
        dispatch(
          showNotification({
            variant: 'success',
            groupKey: 'delegation-signed',
            title: 'Signature added',
            message: `${newConfirmationsCount} of ${delegation.confirmationsRequired} signatures collected.`,
          }),
        )
        onRefetch()
      }
    } catch (err) {
      const error = asError(err)
      setError(error)
      logError(ErrorCodes._820, err)
    } finally {
      setIsSignLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError(undefined)
    try {
      await submitDelegation(delegation)
      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'delegation-submitted',
          title: `Proposer ${delegation.action === 'add' ? 'added' : 'removed'} successfully!`,
          message: '',
        }),
      )
      onRefetch()
    } catch (err) {
      const error = asError(err)
      setError(error)
      logError(ErrorCodes._820, err)
    }
  }

  return (
    <PendingDelegationView
      delegation={delegation}
      remainingSeconds={remainingSeconds}
      hasAlreadySigned={hasAlreadySigned}
      shareUrl={shareUrl}
      isSubmitting={isSubmitting}
      isSignLoading={isSignLoading}
      hasError={!!error}
      onSubmit={handleSubmit}
      onSign={handleSign}
      renderCopyTooltip={(props) => <CopyTooltip text={shareUrl} {...props} />}
      renderErrorMessage={(fallback) =>
        error && <ErrorMessage error={error}>{getProposerErrorText(error, fallback)}</ErrorMessage>
      }
    />
  )
}

export default PendingDelegation
