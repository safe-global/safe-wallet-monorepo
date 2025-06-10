import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import {
  SafesGetSafeV1ApiResponse,
  SafesGetSafeOverviewV1ApiResponse,
  useLazySafesGetSafeV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useCallback, useEffect } from 'react'
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router'
import { addSignerWithEffects } from '@/src/store/signersSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useLazySafesGetOverviewForManyQuery } from '@safe-global/store/gateway/safes'
import { selectAllChainsIds } from '@/src/store/chains'
import { makeSafeId } from '@/src/utils/formatters'
import { extractSignersFromSafes } from '@/src/features/ImportReadOnly/helpers/safes'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { SerializedError } from '@reduxjs/toolkit'
import { LoadingScreen } from '@/src/components/LoadingScreen'
import { selectCurrency } from '@/src/store/settingsSlice'

const getData = (
  manySafes: SafesGetSafeOverviewV1ApiResponse | undefined,
  singleSafe: SafesGetSafeV1ApiResponse | undefined,
  isImporting: string | undefined,
) => {
  if (isImporting) {
    return manySafes || []
  }

  return singleSafe ? [singleSafe] : []
}

const getError = (
  singleSafeError: FetchBaseQueryError | SerializedError | undefined,
  manySafesError: FetchBaseQueryError | SerializedError | undefined,
  isImporting: string | undefined,
) => {
  if (isImporting) {
    return manySafesError
  }
  return singleSafeError
}

export function LoadingImport() {
  const glob = useGlobalSearchParams<{ safeAddress?: string; chainId?: string; import_safe?: string }>()
  const { address } = useLocalSearchParams()
  const chainIds = useAppSelector(selectAllChainsIds)
  const dispatch = useAppDispatch()
  const router = useRouter()
  // we use this screen on the "getting started" and there we don't have an active safe
  const activeSafe = useAppSelector(selectActiveSafe)
  const currency = useAppSelector(selectCurrency)
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

  const [singleSafeTrigger, { data: singleSafeData, error: singleSafeError }] = useLazySafesGetSafeV1Query({})
  const [manySafesTrigger, { data: manySafesData, error: manySafesError }] = useLazySafesGetOverviewForManyQuery()

  const data = getData(manySafesData, singleSafeData, glob.import_safe)
  const error = getError(singleSafeError, manySafesError, glob.import_safe)

  const redirectToError = useCallback(() => {
    router.replace({
      pathname: '/import-signers/private-key-error',
      params: {
        address,
      },
    })
  }, [router])

  useEffect(() => {
    if (glob.import_safe) {
      manySafesTrigger(
        {
          safes: chainIds.map((chainId: string) => makeSafeId(chainId, safeAddress as string)),
          currency,
          trusted: true,
          excludeSpam: true,
        },
        true,
      )
    } else {
      if (safeAddress && chainId) {
        singleSafeTrigger(
          {
            safeAddress,
            chainId,
          },
          true,
        )
      }
    }
  }, [glob.import_safe, safeAddress, chainId, manySafesTrigger, singleSafeTrigger])

  useEffect(() => {
    if (!address || error) {
      redirectToError()
    }
  }, [address, error, redirectToError])

  useEffect(() => {
    if (!data?.length) {
      return
    }

    const owner = Object.values(extractSignersFromSafes(data)).find((owner) => owner.value === address)

    if (owner) {
      dispatch(addSignerWithEffects(owner))

      router.replace({
        pathname: '/import-signers/private-key-success',
        params: {
          name: owner.name,
          address: owner.value,
          safeAddress: safeAddress,
          chainId: chainId,
          import_safe: glob.import_safe,
        },
      })
    } else {
      redirectToError()
    }
  }, [data, redirectToError])

  return <LoadingScreen title="Creating your signer..." description="Verifying address..." />
}
