import CheckWallet from '@/components/common/CheckWallet'
import {
  encodeEIP1271Signature,
  usesV1DelegateEndpoint,
  signProposerDelegation,
  signProposerTypedDataForSafe,
} from '@/features/proposers/utils/utils'
import { useParentSafeThreshold } from '../hooks/useParentSafeThreshold'
import { buildDelegationOrigin, createDelegationMessage } from '../services/delegationMessages'
import useWallet from '@/hooks/wallets/useWallet'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  useDelegatesDeleteDelegateV1Mutation,
  type Delegate,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import React, { useState } from 'react'
import madProps from '@/utils/mad-props'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import { useDelegateMutations } from '@safe-global/utils/hooks/useDelegateMutations'
import useSafeAddress from '@/hooks/useSafeAddress'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { getProposerErrorText } from '@/features/proposers/utils/proposerErrors'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { DeleteProposerDialogView } from '@views/features/proposers/components/DeleteProposerDialogView'

type DeleteProposerProps = {
  wallet: ReturnType<typeof useWallet>
  safeAddress: ReturnType<typeof useSafeAddress>
  chainId: ReturnType<typeof useChainId>
  chain: ReturnType<typeof useCurrentChain>
  proposer: Delegate
}

const InternalDeleteProposer = ({ wallet, safeAddress, chainId, chain, proposer }: DeleteProposerProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [error, setError] = useState<Error>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [multiSigInitiated, setMultiSigInitiated] = useState<boolean>(false)
  const [deleteDelegateV1] = useDelegatesDeleteDelegateV1Mutation()
  const { deleteDelegate } = useDelegateMutations()
  const dispatch = useAppDispatch()
  const nestedSafeOwners = useNestedSafeOwners()

  // For delete, the delegator is always the original creator (proposer.delegator).
  // Determine if it's a nested Safe to decide the signing path.
  const isNestedDelegator = nestedSafeOwners?.some((addr) => sameAddress(addr, proposer.delegator)) ?? false
  const parentSafeAddress = isNestedDelegator ? proposer.delegator : undefined
  const {
    threshold: parentThreshold,
    owners: parentOwners,
    isLoading: isParentLoading,
  } = useParentSafeThreshold(parentSafeAddress)

  const isMultiSigRequired = isNestedDelegator && parentThreshold !== undefined && parentThreshold > 1

  const onConfirm = async () => {
    setError(undefined)

    if (!wallet?.provider || !safeAddress || !chain) {
      setError(new Error('Please connect your wallet first'))
      return
    }

    setIsLoading(true)

    try {
      const useV1Endpoint = usesV1DelegateEndpoint(chain, wallet)
      const signer = await getAssertedChainSigner(wallet.provider)

      if (parentSafeAddress && isMultiSigRequired) {
        // Multi-sig flow: create off-chain message on parent Safe for signature collection
        const eoaSignature = await signProposerTypedDataForSafe(
          chain,
          proposer.delegate,
          parentSafeAddress,
          safeAddress,
          'delete',
          signer,
        )
        const delegateTypedData = getDelegateTypedData(chain, proposer.delegate, safeAddress, 'delete')
        const origin = buildDelegationOrigin('remove', proposer.delegate, safeAddress)

        await createDelegationMessage(dispatch, chainId, parentSafeAddress, delegateTypedData, eoaSignature, origin)

        setMultiSigInitiated(true)
        trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_REMOVE_PROPOSER)
        setIsLoading(false)
        return
      }

      let signature: string

      if (parentSafeAddress) {
        // Single-sig nested Safe owner
        const eoaSignature = await signProposerTypedDataForSafe(
          chain,
          proposer.delegate,
          parentSafeAddress,
          safeAddress,
          'delete',
          signer,
        )
        signature = await encodeEIP1271Signature(parentSafeAddress, eoaSignature)

        await deleteDelegate({
          chain,
          delegateAddress: proposer.delegate,
          deleteDelegateDto: {
            delegator: parentSafeAddress,
            safe: safeAddress,
            signature,
          },
        })
      } else {
        signature = await signProposerDelegation({
          chain,
          wallet,
          proposerAddress: proposer.delegate,
          safeAddress,
          action: 'delete',
          signer,
        })

        if (useV1Endpoint) {
          await deleteDelegateV1({
            chainId,
            delegateAddress: proposer.delegate,
            deleteDelegateDto: {
              delegate: proposer.delegate,
              delegator: proposer.delegator,
              signature,
            },
          }).unwrap()
        } else {
          await deleteDelegate({
            chain,
            delegateAddress: proposer.delegate,
            deleteDelegateDto: {
              delegator: proposer.delegator,
              safe: safeAddress,
              signature,
            },
          })
        }
      }

      trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_REMOVE_PROPOSER)

      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'delete-proposer-success',
          title: 'Proposer deleted successfully!',
          message: `${shortenAddress(proposer.delegate)} cannot suggest transactions anymore.`,
        }),
      )
      setOpen(false)
    } catch (err) {
      setError(asError(err))
      return
    } finally {
      setIsLoading(false)
    }
  }

  const onCancel = () => {
    trackEvent(SETTINGS_EVENTS.PROPOSERS.CANCEL_REMOVE_PROPOSER)
    setOpen(false)
    setIsLoading(false)
    setError(undefined)
    setMultiSigInitiated(false)
  }

  const canDelete =
    sameAddress(wallet?.address, proposer.delegate) ||
    sameAddress(wallet?.address, proposer.delegator) ||
    (nestedSafeOwners?.some((addr) => sameAddress(addr, proposer.delegator)) ?? false)

  return (
    <DeleteProposerDialogView
      open={open}
      canDelete={canDelete}
      multiSigInitiated={multiSigInitiated}
      isMultiSigRequired={isMultiSigRequired}
      parentThreshold={parentThreshold}
      parentOwnersCount={parentOwners?.length}
      isLoading={isLoading}
      isParentLoading={isParentLoading}
      hasError={!!error}
      onOpen={() => setOpen(true)}
      onCancel={onCancel}
      onConfirm={onConfirm}
      renderCheckWallet={(children) => <CheckWallet>{children}</CheckWallet>}
      renderErrorMessage={(fallback) =>
        error && <ErrorMessage error={error}>{getProposerErrorText(error, fallback)}</ErrorMessage>
      }
    />
  )
}

const DeleteProposerDialog = madProps(InternalDeleteProposer, {
  wallet: useWallet,
  chainId: useChainId,
  chain: useCurrentChain,
  safeAddress: useSafeAddress,
})

export default DeleteProposerDialog
