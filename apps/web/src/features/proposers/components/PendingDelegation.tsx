import type { ReactElement } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Countdown } from '@/components/common/Countdown'
import EthHashInfo from '@/components/common/EthHashInfo'
import ErrorMessage from '@/components/tx/ErrorMessage'
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
import type { PendingDelegation as PendingDelegationType } from '@/features/proposers/types'

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
  const { submitDelegation, isSubmitting } = useSubmitDelegation()

  const hasAlreadySigned = delegation.confirmations.some((c) => sameAddress(c.owner.value, wallet?.address))
  const expirationDate = getTotpExpirationDate(delegation.totp)
  const remainingSeconds = Math.max(0, Math.floor((expirationDate.getTime() - Date.now()) / 1000))

  // Link to the parent safe's message page where other owners can sign
  const parentSafeId = chain?.shortName
    ? `${chain.shortName}:${delegation.parentSafeAddress}`
    : `${chainId}:${delegation.parentSafeAddress}`
  const shareUrl = origin
    ? `${origin}${AppRoutes.transactions.msg}?safe=${parentSafeId}&messageHash=${delegation.messageHash}`
    : ''

  const handleSign = async () => {
    if (!wallet?.provider) return

    setError(undefined)
    setIsSignLoading(true)

    try {
      const signer = await getAssertedChainSigner(wallet.provider)

      const eoaSignature = await signProposerTypedDataForSafe(
        chainId,
        delegation.delegateAddress,
        delegation.parentSafeAddress,
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
          title: `Proposer ${delegation.action === 'add' ? 'added' : delegation.action === 'edit' ? 'updated' : 'removed'} successfully!`,
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

  function renderActionButton(): ReactElement | null {
    if (delegation.status === 'ready') {
      return (
        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? <Spinner className="size-4" /> : 'Submit delegation'}
        </Button>
      )
    }

    if (delegation.status !== 'pending') {
      return null
    }

    if (hasAlreadySigned) {
      return (
        <CopyTooltip text={shareUrl} initialToolTipText="Copy link to share">
          <Button size="sm" variant="outline" className="min-w-[100px]" disabled={!shareUrl}>
            Copy link
          </Button>
        </CopyTooltip>
      )
    }

    return (
      <Button size="sm" onClick={handleSign} disabled={isSignLoading} className="min-w-[80px]">
        {isSignLoading ? <Spinner className="size-4" /> : 'Sign'}
      </Button>
    )
  }

  return (
    <div>
      <div className="rounded-lg bg-[var(--color-border-background)] p-4">
        <div className="flex items-center gap-6">
          <Typography variant="paragraph-small" className="whitespace-nowrap">
            {delegation.action === 'remove'
              ? 'Remove proposer:'
              : delegation.action === 'edit'
                ? 'Edit proposer:'
                : 'New proposer:'}
          </Typography>
          <div className="[&_.ethHashInfo-name]:font-bold">
            <EthHashInfo
              address={delegation.delegateAddress}
              showCopyButton
              shortAddress={false}
              name={delegation.delegateLabel}
              hasExplorer
            />
          </div>
        </div>
      </div>

      <Typography variant="paragraph-mini" color="muted" className="mt-2 block">
        {remainingSeconds > 0 ? (
          <>
            Expires in <Countdown seconds={remainingSeconds} />
          </>
        ) : (
          <Typography variant="paragraph-mini" className="text-destructive">
            Expired
          </Typography>
        )}
      </Typography>

      <div className="mt-4 flex items-center justify-between">
        <Typography variant="paragraph">
          <span className="font-bold">
            {delegation.confirmationsSubmitted}/{delegation.confirmationsRequired}
          </span>{' '}
          signatures collected
        </Typography>

        {renderActionButton()}
      </div>

      {error && (
        <div className="mt-2">
          <ErrorMessage error={error}>
            {delegation.status === 'ready' ? 'Error submitting delegation' : 'Error signing delegation'}
          </ErrorMessage>
        </div>
      )}
    </div>
  )
}

export default PendingDelegation
