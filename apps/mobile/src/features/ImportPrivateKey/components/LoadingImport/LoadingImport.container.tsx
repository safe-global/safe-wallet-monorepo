import { useAppDispatch } from '@/src/store/hooks'
import { useCallback, useEffect } from 'react'
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { LoadingScreen } from '@/src/components/LoadingScreen'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'

export function LoadingImport() {
  const glob = useGlobalSearchParams<{ safeAddress?: string; chainId?: string; import_safe?: string }>()
  const { address } = useLocalSearchParams<{ address: string }>()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { validateAddressOwnership } = useAddressOwnershipValidation()

  const redirectToError = useCallback(() => {
    router.replace({
      pathname: '/import-signers/private-key-error',
      params: {
        address,
      },
    })
  }, [router, address])

  useEffect(() => {
    if (!address) {
      redirectToError()
      return
    }

    const validateAndImport = async () => {
      try {
        const validationResult = await validateAddressOwnership(address)

        if (validationResult.isOwner && validationResult.ownerInfo) {
          dispatch(
            addSignerWithEffects({
              ...validationResult.ownerInfo,
              type: 'private-key',
            }),
          )

          router.replace({
            pathname: '/import-signers/private-key-success',
            params: {
              name: validationResult.ownerInfo.name,
              address: validationResult.ownerInfo.value,
              safeAddress: glob.safeAddress,
              chainId: glob.chainId,
              import_safe: glob.import_safe,
            },
          })
        } else {
          redirectToError()
        }
      } catch (_error) {
        redirectToError()
      }
    }

    validateAndImport()
  }, [address, validateAddressOwnership, dispatch, router, glob, redirectToError])

  return <LoadingScreen title="Creating your signer..." description="Verifying address..." />
}
