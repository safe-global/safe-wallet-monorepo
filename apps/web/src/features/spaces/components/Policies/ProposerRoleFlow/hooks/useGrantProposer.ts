import { useCallback, useState } from 'react'
import {
  useDelegatesPostDelegateV1Mutation,
  useDelegatesPostDelegateV2Mutation,
  type CreateDelegateDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { PROPOSER_LABEL_PLACEHOLDER, SMART_CONTRACT_PROPOSER_ERROR } from '@/features/proposers/constants'
import { addressIsNotSmartContract, signProposerData, signProposerTypedData } from '@/features/proposers/utils/utils'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { isEthSignWallet } from '@/utils/wallets'
import type { ProposerRoleFormValues } from '../ProposerRoleForm'

export type GrantProposer = {
  grantProposerRole: (values: ProposerRoleFormValues) => Promise<boolean>
  isSubmitting: boolean
  error?: Error
  blockedReason?: string
  reset: () => void
}

export const useGrantProposer = (): GrantProposer => {
  const wallet = useWallet()
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const provider = useWeb3ReadOnly()
  const dispatch = useAppDispatch()
  const [addDelegateV1] = useDelegatesPostDelegateV1Mutation()
  const [addDelegateV2] = useDelegatesPostDelegateV2Mutation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error>()
  const [blockedReason, setBlockedReason] = useState<string>()

  const reset = useCallback(() => {
    setError(undefined)
    setBlockedReason(undefined)
  }, [])

  const grantProposerRole = useCallback(
    async ({ proposer, name }: ProposerRoleFormValues): Promise<boolean> => {
      if (!wallet || !safeAddress) return false

      reset()
      setIsSubmitting(true)

      try {
        const smartContractError = await addressIsNotSmartContract(
          chainId,
          SMART_CONTRACT_PROPOSER_ERROR,
          provider,
        )(proposer)
        if (smartContractError) {
          setBlockedReason(smartContractError)
          return false
        }

        const shouldEthSign = isEthSignWallet(wallet)
        const signer = await getAssertedChainSigner(wallet.provider)
        const signature = shouldEthSign
          ? await signProposerData(proposer, signer)
          : await signProposerTypedData(chainId, proposer, signer)

        const createDelegateDto: CreateDelegateDto = {
          delegate: proposer,
          delegator: wallet.address,
          label: PROPOSER_LABEL_PLACEHOLDER,
          signature,
          safe: safeAddress,
        }

        if (shouldEthSign) {
          await addDelegateV1({ chainId, createDelegateDto }).unwrap()
        } else {
          await addDelegateV2({ chainId, createDelegateDto }).unwrap()
        }

        dispatch(upsertAddressBookEntries({ chainIds: [chainId], address: proposer, name: sanitizeName(name) }))
        dispatch(
          showNotification({
            variant: 'success',
            groupKey: 'add-proposer-success',
            title: 'Proposer added successfully!',
            message: `${shortenAddress(proposer)} can now suggest transactions for this account.`,
          }),
        )
        return true
      } catch (err) {
        setError(asError(err))
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [wallet, safeAddress, chainId, provider, addDelegateV1, addDelegateV2, dispatch, reset],
  )

  return { grantProposerRole, isSubmitting, error, blockedReason, reset }
}
