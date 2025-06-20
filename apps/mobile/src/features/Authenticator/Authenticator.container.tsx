import React, { useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { AuthenticatorView } from './components/AuthenticatorView'
import { type ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import { EIP712TypedData, SafeTransactionData } from '@safe-global/types-kit'

export const AuthenticatorContainer = () => {
  const { payload } = useLocalSearchParams<{ payload?: string }>()

  const parsedData = useMemo(() => {
    if (!payload) {
      return null
    }

    try {
      const decoded = decodeURIComponent(String(payload))
      return JSON.parse(decoded) as EIP712TypedData
    } catch (e) {
      console.error('Failed to parse payload', e)
      return null
    }
  }, [payload])

  const safeTxHash = useMemo(() => {
    if (!parsedData) {
      return
    }

    let safeTxHash
    if (parsedData.domain?.verifyingContract && parsedData.domain?.chainId && parsedData.message) {
      try {
        safeTxHash = calculateSafeTransactionHash(
          parsedData.domain.verifyingContract,
          parsedData.message as unknown as SafeTransactionData,
          '1.3.0', // TODO: Get version from safe info
          BigInt(parsedData.domain.chainId),
        )
      } catch (e) {
        console.error('Failed to compute safeTxHash', e)
      }
    }
    return safeTxHash
  }, [parsedData])

  return parsedData ? <AuthenticatorView data={parsedData} safeTxHash={safeTxHash} /> : null
}
