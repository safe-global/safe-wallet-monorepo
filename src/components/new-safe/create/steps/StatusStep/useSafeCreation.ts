import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useWeb3, useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useCurrentChain } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import type { EthersError } from '@/utils/ethers-utils'
import { getInitialCreationStatus } from '@/components/new-safe/create/steps/StatusStep/index'
import type { PendingSafeTx } from '@/components/new-safe/create/types'
import {
  createNewSafe,
  getSafeDeployProps,
  checkSafeCreationTx,
  getSafeCreationTxInfo,
  handleSafeCreationError,
  SAFE_CREATION_ERROR_KEY,
  showSafeCreationError,
  relaySafeCreation,
  estimateSafeCreationGas,
} from '@/components/new-safe/create/logic'
import { useAppDispatch } from '@/store'
import { closeByGroupKey } from '@/store/notificationsSlice'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import { waitForCreateSafeTx } from '@/services/tx/txMonitor'
import useGasPrice from '@/hooks/useGasPrice'
import { hasFeature } from '@/utils/chains'
import { FEATURES } from '@safe-global/safe-gateway-typescript-sdk'
import type { DeploySafeProps } from '@safe-global/protocol-kit'
import { usePendingSafe } from './usePendingSafe'

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
  status: SafeCreationStatus,
  setStatus: Dispatch<SetStateAction<SafeCreationStatus>>,
  willRelay: boolean,
) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const dispatch = useAppDispatch()
  const [pendingSafe, setPendingSafe] = usePendingSafe()

  const wallet = useWallet()
  const provider = useWeb3()
  const web3ReadOnly = useWeb3ReadOnly()
  const chain = useCurrentChain()
  const [gasPrice, , gasPriceLoading] = useGasPrice()

  const maxFeePerGas = gasPrice?.maxFeePerGas
  const maxPriorityFeePerGas = gasPrice?.maxPriorityFeePerGas

  const isEIP1559 = chain && hasFeature(chain, FEATURES.EIP1559)

  const createSafeCallback = useCallback(
    async (txHash: string, tx: PendingSafeTx) => {
      setStatus(SafeCreationStatus.PROCESSING)
      trackEvent(CREATE_SAFE_EVENTS.SUBMIT_CREATE_SAFE)
      setPendingSafe(pendingSafe ? { ...pendingSafe, txHash, tx } : undefined)
    },
    [setStatus, setPendingSafe, pendingSafe],
  )

  const handleCreateSafe = useCallback(async () => {
    if (!pendingSafe || !provider || !chain || !wallet || isCreating || gasPriceLoading) return

    setIsCreating(true)
    dispatch(closeByGroupKey({ groupKey: SAFE_CREATION_ERROR_KEY }))

    const { owners, threshold, saltNonce, id, seed } = pendingSafe
    const ownersAddresses = owners.map((owner) => owner.address)
    console.debug({ pendingSafe })

    try {
      if (willRelay) {
        const taskId = await relaySafeCreation(chain, ownersAddresses, threshold, saltNonce)

        setPendingSafe(pendingSafe ? { ...pendingSafe, taskId } : undefined)
        setStatus(SafeCreationStatus.PROCESSING)
        waitForCreateSafeTx(taskId, setStatus)
      } else {
        const tx = await getSafeCreationTxInfo(provider, owners, threshold, saltNonce, chain, wallet, id, seed)
        const safeParams = {
          threshold,
          owners: owners.map((owner) => owner.address),
          saltNonce,
          id,
          seed,
        }

        const safeDeployProps = await getSafeDeployProps(safeParams, (txHash) => createSafeCallback(txHash, tx), chain)

        const gasLimit = await estimateSafeCreationGas(chain, provider, tx.from, safeParams)

        const options: DeploySafeProps['options'] = isEIP1559
          ? {
              maxFeePerGas: maxFeePerGas?.toString(),
              maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
              gasLimit: gasLimit.toString(),
            }
          : { gasPrice: maxFeePerGas?.toString(), gasLimit: gasLimit.toString() }

        const response = await createNewSafe(provider, {
          ...safeDeployProps,
          options,
        })
        console.debug(await response.getAddress())
        setStatus(SafeCreationStatus.SUCCESS)
      }
    } catch (err) {
      const _err = err as EthersError
      const status = handleSafeCreationError(_err)

      setStatus(status)

      if (status !== SafeCreationStatus.SUCCESS) {
        dispatch(showSafeCreationError(_err))
      }
    }

    setIsCreating(false)
  }, [
    chain,
    createSafeCallback,
    dispatch,
    gasPriceLoading,
    isCreating,
    isEIP1559,
    maxFeePerGas,
    maxPriorityFeePerGas,
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

  // Create or monitor Safe creation
  useEffect(() => {
    if (status !== getInitialCreationStatus(willRelay)) return

    if (pendingSafe?.txHash && !isCreating) {
      void watchSafeTx()
      return
    }

    if (pendingSafe?.taskId && !isCreating) {
      waitForCreateSafeTx(pendingSafe.taskId, setStatus)
      return
    }

    void handleCreateSafe()
  }, [
    handleCreateSafe,
    isCreating,
    pendingSafe?.taskId,
    pendingSafe?.txHash,
    setStatus,
    status,
    watchSafeTx,
    willRelay,
  ])

  return {
    handleCreateSafe,
  }
}
