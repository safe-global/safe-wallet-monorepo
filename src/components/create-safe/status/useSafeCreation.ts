import { PendingSafeData } from '@/components/create-safe'
import { createNewSafe } from '@/components/create-safe/sender'
import { usePendingSafeCreation } from '@/components/create-safe/status/usePendingSafeCreation'
import { usePendingSafe } from '@/components/create-safe/usePendingSafe'
import { useWeb3 } from '@/hooks/wallets/web3'
import { DeploySafeProps } from '@gnosis.pm/safe-core-sdk'
import { useCallback, useEffect, useState } from 'react'
import { PredictSafeProps } from '@gnosis.pm/safe-core-sdk/dist/src/safeFactory'
import useWallet from '@/hooks/wallets/useWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import useWatchSafeCreation from '@/components/create-safe/status/hooks/useWatchSafeCreation'
import { AppThunk, useAppDispatch } from '@/store'
import { Errors, logError } from '@/services/exceptions'
import { upsertAddressBookEntry } from '@/store/addressBookSlice'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { defaultSafeInfo } from '@/store/safeInfoSlice'
import useChainId from '@/hooks/useChainId'

export enum SafeCreationStatus {
  AWAITING = 'AWAITING',
  AWAITING_WALLET = 'AWAITING_WALLET',
  MINING = 'MINING',
  ERROR = 'ERROR',
  REVERTED = 'REVERTED',
  TIMEOUT = 'TIMEOUT',
  SUCCESS = 'SUCCESS',
  INDEXED = 'INDEXED',
  INDEX_FAILED = 'INDEX_FAILED',
}

export const addSafeAndOwnersToAddressBook = (pendingSafe: PendingSafeData, chainId: string): AppThunk => {
  return (dispatch) => {
    dispatch(
      upsertAddressBookEntry({
        chainId: chainId,
        address: pendingSafe.address,
        name: pendingSafe.name,
      }),
    )

    pendingSafe.owners.forEach((owner) => {
      dispatch(upsertAddressBookEntry({ chainId: chainId, address: owner.address, name: owner.name }))
    })

    dispatch(
      addOrUpdateSafe({
        safe: {
          ...defaultSafeInfo,
          address: { value: pendingSafe.address, name: pendingSafe.name },
          threshold: pendingSafe.threshold,
          owners: pendingSafe.owners.map((owner) => ({
            value: owner.address,
            name: owner.name,
          })),
          chainId: chainId,
          nonce: 0,
        },
      }),
    )
  }
}

export const getSafeDeployProps = (
  pendingSafe: PendingSafeData,
  callback: (txHash: string) => void,
): PredictSafeProps & { callback: DeploySafeProps['callback'] } => {
  return {
    safeAccountConfig: {
      threshold: pendingSafe.threshold,
      owners: pendingSafe.owners.map((owner) => owner.address),
    },
    safeDeploymentConfig: {
      saltNonce: pendingSafe.saltNonce.toString(),
    },
    callback,
  }
}

export const useSafeCreation = () => {
  const [status, setStatus] = useState<SafeCreationStatus>(SafeCreationStatus.AWAITING_WALLET)
  const [safeAddress, setSafeAddress] = useState<string>()
  const [isCreationPending, setIsCreationPending] = useState<boolean>(false)
  const [pendingSafe, setPendingSafe] = usePendingSafe()
  const provider = useWeb3()
  const chainId = useChainId()
  const wallet = useWallet()
  const isWrongChain = useIsWrongChain()
  const dispatch = useAppDispatch()

  const safeCreationCallback = useCallback(
    (txHash: string) => {
      setStatus(SafeCreationStatus.MINING)
      setPendingSafe((prev) => (prev ? { ...prev, txHash } : undefined))
    },
    [setPendingSafe],
  )

  const createSafe = useCallback(async () => {
    if (!provider || !pendingSafe || isCreationPending) return

    setStatus(SafeCreationStatus.AWAITING)
    setIsCreationPending(true)

    try {
      await createNewSafe(provider, getSafeDeployProps(pendingSafe, safeCreationCallback))
      setStatus(SafeCreationStatus.SUCCESS)
      dispatch(addSafeAndOwnersToAddressBook(pendingSafe, chainId))
    } catch (err) {
      setStatus(SafeCreationStatus.ERROR)
      logError(Errors._800, (err as Error).message)
    }

    setIsCreationPending(false)
  }, [chainId, dispatch, isCreationPending, pendingSafe, provider, safeCreationCallback])

  usePendingSafeCreation({ txHash: pendingSafe?.txHash, setStatus })
  useWatchSafeCreation({ status, safeAddress, pendingSafe, setPendingSafe, setStatus })

  useEffect(() => {
    const newStatus = !wallet || isWrongChain ? SafeCreationStatus.AWAITING_WALLET : SafeCreationStatus.AWAITING
    setStatus(newStatus)
  }, [wallet, isWrongChain])

  useEffect(() => {
    if (!pendingSafe) return

    setSafeAddress(pendingSafe.address)
  }, [pendingSafe])

  useEffect(() => {
    if (status === SafeCreationStatus.AWAITING) {
      createSafe()
    }
  }, [status, createSafe])

  return {
    safeAddress,
    status,
    createSafe,
    txHash: pendingSafe?.txHash,
  }
}
