import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useEffect } from 'react'
import { LoadingImportComponent } from './LoadingImport'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { addSigner } from '@/src/store/signersSlice'

export function LoadingImport() {
  const { address } = useLocalSearchParams()
  const dispatch = useAppDispatch()
  const router = useRouter()

  const activeSafe = useAppSelector(selectActiveSafe)
  const { data } = useSafesGetSafeV1Query({
    safeAddress: activeSafe.address,
    chainId: activeSafe.chainId,
  })

  useEffect(() => {
    const redirectToError = () => {
      router.replace({
        pathname: '/import-signers/import-private-key-error',
        params: {
          address,
        },
      })
    }

    if (!address) {
      redirectToError()
    }

    if (!data) {
      return
    }

    const owner = data.owners.find((owner) => owner.value === address)

    if (owner) {
      dispatch(addSigner(owner))

      router.replace({
        pathname: '/import-signers/import-private-key-success',
        params: {
          name: owner.name,
          address: owner.value,
        },
      })
    } else {
      redirectToError()
    }
  }, [address, data])

  return <LoadingImportComponent />
}
