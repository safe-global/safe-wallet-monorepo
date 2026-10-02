import { useCallback, useState } from 'react'
import type { OnboardAPI } from '@web3-onboard/core'
import {
  useDelegatesPostDelegateV1Mutation,
  type CreateDelegateDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { PROPOSER_LABEL_PLACEHOLDER, SMART_CONTRACT_PROPOSER_ERROR } from '@/features/proposers/constants'
import { addressIsNotSmartContract, signProposerData, signProposerTypedData } from '@/features/proposers/utils/utils'
import { useDelegateMutations } from '@/features/proposers'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { useChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import useOnboard from '@/hooks/wallets/useOnboard'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { SPACE_LABELS } from '@/services/analytics/events/spaces'
import { assertWalletChain, getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { isEthSignWallet } from '@/utils/wallets'
import type { ProposerRoleFormValues } from '../ProposerRoleForm'
import { WORKSPACE_CONFIRMATION_HIDE_MS } from '../../../../constants'
import { formatContactLabel } from '../../utils/policyLabel'
import { useAddOrRequestWorkspaceContact } from '../../../../hooks/useAddOrRequestWorkspaceContact'
import { useIsAdmin } from '../../../../hooks/useSpaceMembers'

export type GrantProposer = {
  grantProposerRole: (values: ProposerRoleFormValues, safeLabel?: string) => Promise<boolean>
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

const signDelegation = async (
  onboard: OnboardAPI,
  chain: Chain,
  safeAddress: string,
  proposer: string,
): Promise<SignedDelegation> => {
  // The Safe comes from a dropdown, not the URL, so the wallet may sit on any chain at submit time.
  const activeWallet = await assertWalletChain(onboard, chain.chainId)

  const useV1Endpoint = isEthSignWallet(activeWallet)
  const signer = await getAssertedChainSigner(activeWallet.provider)
  const signature = useV1Endpoint
    ? await signProposerData(proposer, signer)
    : await signProposerTypedData(chain, proposer, safeAddress, 'add', signer)

  return { signature, useV1Endpoint, delegator: activeWallet.address }
}

export const useGrantProposer = (): GrantProposer => {
  const wallet = useWallet()
  const onboard = useOnboard()
  const chainId = useChainId()
  const chain = useChain(chainId)
  const safeAddress = useSafeAddress()
  const provider = useWeb3ReadOnly()
  const dispatch = useAppDispatch()
  const addOrRequestContact = useAddOrRequestWorkspaceContact(SPACE_LABELS.proposer_role_flow)
  const isAdmin = useIsAdmin()
  const { get: getContact } = useMergedAddressBooks(chainId)
  const [addDelegateV1] = useDelegatesPostDelegateV1Mutation()
  const { addDelegate } = useDelegateMutations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error>()
  const [blockedReason, setBlockedReason] = useState<string>()

  const reset = useCallback(() => {
    setError(undefined)
    setBlockedReason(undefined)
  }, [])

  const submitDelegation = useCallback(
    async (chain: Chain, proposer: string, { signature, useV1Endpoint, delegator }: SignedDelegation) => {
      const createDelegateDto: CreateDelegateDto = {
        delegate: proposer,
        delegator,
        label: PROPOSER_LABEL_PLACEHOLDER,
        signature,
        safe: safeAddress,
      }

      if (useV1Endpoint) {
        await addDelegateV1({ chainId: chain.chainId, createDelegateDto }).unwrap()
      } else {
        await addDelegate({ chain, createDelegateDto })
      }
    },
    [safeAddress, addDelegateV1, addDelegate],
  )

  const announceSuccess = useCallback(
    (proposer: string, rawName: string, safeLabel: string) => {
      const name = sanitizeName(rawName)
      const proposerLabel = formatContactLabel(proposer, name)
      // A member's request waits for an admin, so a new contact is also kept in their local address book
      if (!isAdmin && !getContact(proposer, chainId)) {
        dispatch(upsertAddressBookEntries({ chainIds: [chainId], address: proposer, name }))
      }
      void addOrRequestContact({ address: proposer, name, chainIds: [chainId] })
      dispatch(
        showNotification({
          variant: 'success',
          groupKey: 'add-proposer-success',
          autoHideDuration: WORKSPACE_CONFIRMATION_HIDE_MS,
          title: 'Proposer added successfully!',
          message: `${proposerLabel} can now suggest transactions for ${safeLabel}.`,
        }),
      )
    },
    [dispatch, addOrRequestContact, chainId, isAdmin, getContact],
  )

  const grantProposerRole = useCallback(
    async ({ proposer, name }: ProposerRoleFormValues, safeLabel?: string): Promise<boolean> => {
      trackEvent(POLICY_EVENTS.PROPOSER_SUBMITTED, { [MixpanelEventParams.CHAIN_ID]: chainId })

      if (!wallet || !onboard || !safeAddress || !chain) return false

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

        const signed = await signDelegation(onboard, chain, safeAddress, proposer)
        await submitDelegation(chain, proposer, signed)
        announceSuccess(proposer, name, safeLabel ?? shortenAddress(safeAddress))

        return true
      } catch (err) {
        setError(asError(err))
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [wallet, onboard, safeAddress, chainId, chain, provider, reset, submitDelegation, announceSuccess],
  )

  return { grantProposerRole, isSubmitting, error, blockedReason, reset }
}
