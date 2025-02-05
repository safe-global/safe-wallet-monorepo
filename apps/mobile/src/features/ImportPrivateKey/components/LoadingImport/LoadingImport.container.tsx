import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useCallback, useEffect } from 'react'
import { LoadingImportComponent } from './LoadingImport'
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router'
import { addSigner } from '@/src/store/signersSlice'

export function LoadingImport() {
  const { address } = useLocalSearchParams()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const glob = useGlobalSearchParams<{ safeAddress?: string; chainId?: string }>()
  const activeSafe = useAppSelector(selectActiveSafe)

  const { data, error } = useSafesGetSafeV1Query({
    safeAddress: glob.safeAddress || activeSafe.address,
    chainId: glob.chainId || activeSafe.chainId,
  })

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
