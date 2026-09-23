import { useCallback, useState } from 'react'
import {
  useDelegatesDeleteDelegateV1Mutation,
  useDelegatesDeleteDelegateV2Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { signProposerData, signProposerTypedData } from '@/features/proposers/utils/utils'
import useOnboard from '@/hooks/wallets/useOnboard'
import { assertWalletChain, getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { isEthSignWallet } from '@/utils/wallets'
import type { ProposerRef } from './types'

/** The grant the connected wallet made, or the first one when the proposer removes itself. */
const getDelegator = ({ proposer }: ProposerRef, walletAddress: string): string | undefined =>
  proposer.delegatedBy.find((grant) => sameAddress(grant.delegator, walletAddress))?.delegator ??
  proposer.delegatedBy[0]?.delegator

/** Mirrors the Safe settings proposer removal for a delegator that is an EOA. */
export const useRemoveProposer = (ref: ProposerRef, onRemoved: () => void) => {
  const onboard = useOnboard()
  const dispatch = useAppDispatch()
  const [deleteDelegateV1] = useDelegatesDeleteDelegateV1Mutation()
  const [deleteDelegateV2] = useDelegatesDeleteDelegateV2Mutation()
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<Error>()

  const { chainId, address: safeAddress } = ref.policy.safe
  const delegateAddress = ref.proposer.proposer

  const removeProposer = useCallback(async () => {
    setError(undefined)

    if (!onboard) {
      setError(new Error('Please connect your wallet first'))
      return
    }

    setIsRemoving(true)

    try {
      const wallet = await assertWalletChain(onboard, chainId)
      const delegator = getDelegator(ref, wallet.address)

      if (!delegator) throw new Error('This proposer has no grant to remove')

      const signer = await getAssertedChainSigner(wallet.provider)

      if (isEthSignWallet(wallet)) {
        const signature = await signProposerData(delegateAddress, signer)

        await deleteDelegateV1({
          chainId,
          delegateAddress,
          deleteDelegateDto: { delegate: delegateAddress, delegator, signature },
        }).unwrap()
      } else {
        const signature = await signProposerTypedData(chainId, delegateAddress, signer)

        await deleteDelegateV2({
          chainId,
          delegateAddress,
          deleteDelegateV2Dto: { delegator, safe: safeAddress, signature },
        }).unwrap()
      }

      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'delete-proposer-success',
          title: 'Proposer deleted successfully!',
          message: `${shortenAddress(delegateAddress)} can not suggest transactions anymore.`,
        }),
      )
      onRemoved()
    } catch (err) {
      setError(asError(err))
    } finally {
      setIsRemoving(false)
    }
  }, [onboard, chainId, safeAddress, delegateAddress, ref, deleteDelegateV1, deleteDelegateV2, dispatch, onRemoved])

  const resetError = useCallback(() => setError(undefined), [])

  return { removeProposer, isRemoving, error, resetError }
}
