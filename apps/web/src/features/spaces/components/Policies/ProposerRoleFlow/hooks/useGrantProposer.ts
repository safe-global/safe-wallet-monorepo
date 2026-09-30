import { useCallback, useState } from 'react'
import type { OnboardAPI } from '@web3-onboard/core'
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
import useOnboard from '@/hooks/wallets/useOnboard'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { SETTINGS_EVENTS, trackEvent } from '@/services/analytics'
import { assertWalletChain, getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
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

/** The endpoint version is dictated by the signing method, so both are decided together. */
type SignedDelegation = {
  signature: string
  useV1Endpoint: boolean
  delegator: string
}

const signDelegation = async (onboard: OnboardAPI, chainId: string, proposer: string): Promise<SignedDelegation> => {
  // The Safe comes from a dropdown, not the URL, so the wallet may sit on any chain at submit time.
  const activeWallet = await assertWalletChain(onboard, chainId)

  const useV1Endpoint = isEthSignWallet(activeWallet)
  const signer = await getAssertedChainSigner(activeWallet.provider)
  const signature = useV1Endpoint
    ? await signProposerData(proposer, signer)
    : await signProposerTypedData(chainId, proposer, signer)

  return { signature, useV1Endpoint, delegator: activeWallet.address }
}

export const useGrantProposer = (): GrantProposer => {
  const wallet = useWallet()
  const onboard = useOnboard()
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

  const submitDelegation = useCallback(
    async (proposer: string, { signature, useV1Endpoint, delegator }: SignedDelegation) => {
      const createDelegateDto: CreateDelegateDto = {
        delegate: proposer,
        delegator,
        label: PROPOSER_LABEL_PLACEHOLDER,
        signature,
        safe: safeAddress,
      }

      const addDelegate = useV1Endpoint ? addDelegateV1 : addDelegateV2
      await addDelegate({ chainId, createDelegateDto }).unwrap()
    },
    [safeAddress, chainId, addDelegateV1, addDelegateV2],
  )

  const announceSuccess = useCallback(
    (proposer: string, name: string) => {
      dispatch(upsertAddressBookEntries({ chainIds: [chainId], address: proposer, name: sanitizeName(name) }))
      trackEvent(SETTINGS_EVENTS.PROPOSERS.SUBMIT_ADD_PROPOSER)
      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'add-proposer-success',
          title: 'Proposer added successfully!',
          message: `${shortenAddress(proposer)} can now suggest transactions for this account.`,
        }),
      )
    },
    [dispatch, chainId],
  )

  const grantProposerRole = useCallback(
    async ({ proposer, name }: ProposerRoleFormValues): Promise<boolean> => {
      if (!wallet || !onboard || !safeAddress) return false

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

        const signed = await signDelegation(onboard, chainId, proposer)
        await submitDelegation(proposer, signed)
        announceSuccess(proposer, name)

        return true
      } catch (err) {
        setError(asError(err))
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [wallet, onboard, safeAddress, chainId, provider, reset, submitDelegation, announceSuccess],
  )

  return { grantProposerRole, isSubmitting, error, blockedReason, reset }
}
