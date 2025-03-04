import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useCallback, useEffect } from 'react'
import { LoadingImportComponent } from './LoadingImport'
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router'
import { addSigner } from '@/src/store/signersSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { skipToken } from '@reduxjs/toolkit/query'

export function LoadingImport() {
  const { address } = useLocalSearchParams()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const glob = useGlobalSearchParams<{ safeAddress?: string; chainId?: string }>()
  // we use this screen on the "getting started" and there we don't have an active safe
  const activeSafe = useAppSelector(selectActiveSafe)

  let safeAddress = glob.safeAddress
  let chainId = glob.chainId
  if (activeSafe) {
    if (!safeAddress) {
      safeAddress = activeSafe.address
    }

    if (!chainId) {
      chainId = activeSafe.chainId
    }
  }

  const { data, error } = useSafesGetSafeV1Query(
    safeAddress && chainId
      ? {
          safeAddress,
          chainId,
        }
      : skipToken,
  )

  const redirectToError = useCallback(() => {
    router.replace({
      pathname: '/import-signers/private-key-error',
      params: {
        address,
      },
    })
  }, [router])

  useEffect(() => {
    if (!address || error) {
      redirectToError()
    }
  }, [address, error, redirectToError])

  useEffect(() => {
    if (!data) {
      return
    }

    const owner = data.owners.find((owner) => owner.value === address)

    if (owner) {
      dispatch(addSigner(owner))

      router.replace({
        pathname: '/import-signers/private-key-success',
        params: {
          name: owner.name,
          address: owner.value,
        },
      })
    } else {
      redirectToError()
    }
  }, [data, redirectToError])

  return <LoadingImportComponent />
}
