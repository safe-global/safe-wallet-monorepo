import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useWeb3, useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useCurrentChain } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import type { EthersError } from '@/utils/ethers-utils'
import type { PendingSafeData } from '@/components/new-safe/create/steps/StatusStep/index'
import type { PendingSafeTx } from '@/components/new-safe/create/types'
import {
  createNewSafe,
  getSafeDeployProps,
  checkSafeCreationTx,
  getSafeCreationTxInfo,
  handleSafeCreationError,
  SAFE_CREATION_ERROR_KEY,
  showSafeCreationError,
  createNewSafeViaRelayer,
} from '@/components/new-safe/create/logic'
import { useAppDispatch } from '@/store'
import { closeByGroupKey } from '@/store/notificationsSlice'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import { waitForCreateSafeTx } from '@/services/tx/txMonitor'

export enum SafeCreationStatus {
  AWAITING,
  PROCESSING,
  WALLET_REJECTED,
  ERROR,
  REVERTED,
  TIMEOUT,
  SUCCESS,
  INDEXED,
  INDEX_FAILED,
}

export const useSafeCreation = (
  pendingSafe: PendingSafeData | undefined,
  setPendingSafe: Dispatch<SetStateAction<PendingSafeData | undefined>>,
  status: SafeCreationStatus,
  setStatus: Dispatch<SetStateAction<SafeCreationStatus>>,
  willRelay?: boolean,
) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const dispatch = useAppDispatch()

  const wallet = useWallet()
  const provider = useWeb3()
  const web3ReadOnly = useWeb3ReadOnly()
  const chain = useCurrentChain()

  const createSafeCallback = useCallback(
    async (txHash: string, tx: PendingSafeTx) => {
      setStatus(SafeCreationStatus.PROCESSING)
      trackEvent(CREATE_SAFE_EVENTS.SUBMIT_CREATE_SAFE)
      setPendingSafe((prev) => (prev ? { ...prev, txHash, tx } : undefined))
    },
    [setStatus, setPendingSafe],
  )

  const createSafe = useCallback(async () => {
    if (!pendingSafe || !provider || !chain || !wallet || isCreating) return

    setIsCreating(true)
    dispatch(closeByGroupKey({ groupKey: SAFE_CREATION_ERROR_KEY }))

    const { owners, threshold, saltNonce } = pendingSafe
    const ownersAddresses = owners.map((owner) => owner.address)

    if (willRelay) {
      try {
        const taskId = await createNewSafeViaRelayer(chain, ownersAddresses, threshold, saltNonce)

        setPendingSafe((prev) => (prev ? { ...prev, taskId } : undefined))
        setStatus(SafeCreationStatus.PROCESSING)
        waitForCreateSafeTx(taskId, setStatus)
      } catch (error) {
        setStatus(SafeCreationStatus.ERROR)
        showSafeCreationError(error as Error)
      }
    } else {
      try {
        const tx = await getSafeCreationTxInfo(provider, pendingSafe, chain, wallet)

        const safeParams = getSafeDeployProps(
          {
            threshold,
            owners: ownersAddresses,
            saltNonce,
          },
          (txHash) => createSafeCallback(txHash, tx),
          chain.chainId,
        )

        await createNewSafe(provider, safeParams)
        setStatus(SafeCreationStatus.SUCCESS)
      } catch (err) {
        const _err = err as EthersError
        const status = handleSafeCreationError(_err)

        setStatus(status)

        if (status !== SafeCreationStatus.SUCCESS) {
          dispatch(showSafeCreationError(_err))
        }
      }
    }

    setIsCreating(false)
  }, [
    chain,
    createSafeCallback,
    dispatch,
    isCreating,
    pendingSafe,
    provider,
    setPendingSafe,
    setStatus,
    wallet,
    willRelay,
  ])

  const watchSafeTx = useCallback(async () => {
    if (!pendingSafe?.tx || !pendingSafe?.txHash || !web3ReadOnly || isWatching) return

    setStatus(SafeCreationStatus.PROCESSING)
    setIsWatching(true)

    const txStatus = await checkSafeCreationTx(web3ReadOnly, pendingSafe.tx, pendingSafe.txHash, dispatch)
    setStatus(txStatus)
    setIsWatching(false)
  }, [isWatching, pendingSafe, web3ReadOnly, setStatus, dispatch])

  useEffect(() => {
    if (status !== SafeCreationStatus.AWAITING) return

    if (pendingSafe?.txHash && !isCreating) {
      void watchSafeTx()
      return
    }

    if (pendingSafe?.taskId && !isCreating) {
      waitForCreateSafeTx(pendingSafe.taskId, setStatus)
      return
    }

    void createSafe()
  }, [createSafe, watchSafeTx, isCreating, pendingSafe?.txHash, status, pendingSafe?.taskId, setStatus])

  return {
    createSafe,
  }
}
