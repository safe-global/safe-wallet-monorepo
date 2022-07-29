import { PendingSafeData } from '@/components/create-safe'
import { createNewSafe } from '@/components/create-safe/sender'
import { usePendingSafeCreation } from '@/components/create-safe/status/usePendingSafeCreation'
import { usePendingSafe } from '@/components/create-safe/usePendingSafe'
import { AppRoutes } from '@/config/routes'
import { useWeb3 } from '@/hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'
import { useAppDispatch } from '@/store'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { upsertAddressBookEntry } from '@/store/addressBookSlice'
import { defaultSafeInfo } from '@/store/safeInfoSlice'
import Safe from '@gnosis.pm/safe-core-sdk'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'

export enum SafeCreationStatus {
  PENDING = 'PENDING',
  MINING = 'MINING',
  ERROR = 'ERROR',
  REVERTED = 'REVERTED',
  TIMEOUT = 'TIMEOUT',
  SUCCESS = 'SUCCESS',
}

const getSafeDeployProps = (pendingSafe: PendingSafeData, callback: (txHash: string) => void) => {
  return {
    safeAccountConfig: {
      threshold: pendingSafe.threshold,
      owners: pendingSafe.owners.map((owner) => owner.address),
    },
    safeDeploymentConfig: {
      saltNonce: pendingSafe.saltNonce,
    },
    callback,
  }
}

export const useSafeCreation = () => {
  const [status, setStatus] = useState<SafeCreationStatus>(SafeCreationStatus.PENDING)
  const [safeAddress, setSafeAddress] = useState<string>()
  const [creationPromise, setCreationPromise] = useState<Promise<Safe>>()
  const [pendingSafe, setPendingSafe] = usePendingSafe()
  const ethersProvider = useWeb3()
  const dispatch = useAppDispatch()
  const router = useRouter()

  usePendingSafeCreation({ txHash: pendingSafe?.txHash, setSafeAddress, setStatus })

  const safeCreationCallback = useCallback(
    (txHash: string) => {
      setStatus(SafeCreationStatus.MINING)
      setPendingSafe((prev) => prev && { ...prev, txHash })
    },
    [setPendingSafe],
  )

  const onRetry = () => {
    if (!ethersProvider || !pendingSafe) return

    setStatus(SafeCreationStatus.PENDING)
    setCreationPromise(createNewSafe(ethersProvider, getSafeDeployProps(pendingSafe, safeCreationCallback)))
  }

  useEffect(() => {
    if (
      creationPromise ||
      pendingSafe?.txHash ||
      !ethersProvider ||
      !pendingSafe ||
      status === SafeCreationStatus.ERROR
    ) {
      return
    }

    setStatus(SafeCreationStatus.PENDING)
    setCreationPromise(createNewSafe(ethersProvider, getSafeDeployProps(pendingSafe, safeCreationCallback)))
  }, [safeCreationCallback, creationPromise, ethersProvider, pendingSafe, status])

  useEffect(() => {
    if (!creationPromise || !pendingSafe) return

    creationPromise
      .then((safe) => {
        setStatus(SafeCreationStatus.SUCCESS)
        setSafeAddress(safe.getAddress())
        safe
          .getChainId()
          .then((chainId) => {
            // Update Addressbook
            if (pendingSafe.name) {
              dispatch(
                upsertAddressBookEntry({
                  chainId: chainId.toString(),
                  address: safe.getAddress(),
                  name: pendingSafe.name,
                }),
              )
            }
            pendingSafe.owners.forEach((owner) => {
              if (owner.name) {
                dispatch(
                  upsertAddressBookEntry({ chainId: chainId.toString(), address: owner.address, name: owner.name }),
                )
              }
            })
            // Add to added safes
            dispatch(
              addOrUpdateSafe({
                safe: {
                  ...defaultSafeInfo,
                  address: { value: safe.getAddress(), name: pendingSafe.name },
                  threshold: pendingSafe.threshold,
                  owners: pendingSafe.owners.map((owner) => ({
                    value: owner.address,
                    name: owner.name,
                  })),
                  chainId: chainId.toString(),
                  nonce: 0,
                },
              }),
            )
          })
          .catch((error: Error) => {
            logError(Errors._104, error.message)
          })
      })
      .catch((error: Error) => {
        setStatus(SafeCreationStatus.ERROR)
        logError(Errors._800, error.message)
      })
  }, [creationPromise, dispatch, pendingSafe, router, setPendingSafe])

  useEffect(() => {
    if (status === SafeCreationStatus.SUCCESS) {
      setPendingSafe(undefined)
      safeAddress && router.push({ pathname: AppRoutes.safe.home, query: { safe: safeAddress, new: 1 } })
    }

    if (status === SafeCreationStatus.ERROR || status === SafeCreationStatus.REVERTED) {
      setCreationPromise(undefined)
      setPendingSafe((prev) => prev && { ...prev, txHash: undefined })
    }
  }, [status, safeAddress, setPendingSafe, router])

  return {
    status,
    onRetry,
    txHash: pendingSafe?.txHash,
  }
}
