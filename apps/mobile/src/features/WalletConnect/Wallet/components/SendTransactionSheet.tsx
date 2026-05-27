import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { Text, YStack, XStack, Button } from 'tamagui'
import type { IWalletKit } from '@reown/walletkit'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { removePending, setOutstandingRequest, clearOutstandingRequest } from '../store/walletKitSlice'
import { clearDraft } from '@/src/store/draftTxSlice'
import { composeSafeTxDraft, type DappCall } from '../services/composeSafeTxDraft'

type Props = {
  walletKit: IWalletKit
  pending: {
    id: number
    topic: string
    chainId: string
    method: 'eth_sendTransaction' | 'wallet_sendCalls' | string
    params: unknown
  }
}

const extractCalls = (method: string, params: unknown): DappCall[] => {
  if (method === 'eth_sendTransaction') {
    const [tx] = params as [DappCall]
    return [tx]
  }
  if (method === 'wallet_sendCalls') {
    const [batch] = params as [{ calls: DappCall[] }]
    return batch.calls
  }
  throw new Error(`Unsupported method in SendTransactionSheet: ${method}`)
}

export const SendTransactionSheet: React.FC<Props> = ({ walletKit, pending }) => {
  const dispatch = useAppDispatch()
  const activeSafe = useAppSelector(selectActiveSafe)
  const { data: safe } = useSafesGetSafeV1Query(
    activeSafe ? { chainId: activeSafe.chainId, safeAddress: activeSafe.address } : skipToken,
  )
  const [composing, setComposing] = useState(false)
  const [composedHash, setComposedHash] = useState<string | null>(null)
  // Becomes true when the user taps Sign and we hand the draft off to review-and-confirm.
  // The unmount cleanup uses this to decide whether to GC the draft.
  const handedOffRef = useRef(false)

  const calls = useMemo(() => {
    try {
      return extractCalls(pending.method, pending.params)
    } catch {
      return null
    }
  }, [pending.method, pending.params])

  // Declared BEFORE the compose effect so the catch handler can reference it without TDZ smell.
  const respondWithReject = async () => {
    await walletKit.respondSessionRequest({
      topic: pending.topic,
      response: formatJsonRpcError(pending.id, getSdkError('USER_REJECTED').message),
    })
    dispatch(removePending({ id: pending.id, kind: 'request' }))
    if (composedHash) {
      // Drop the draft so it doesn't linger in the queue UI.
      dispatch(clearDraft(composedHash))
    }
  }

  const onReject = async () => {
    if (composedHash) {
      // Make sure we don't leave a stale outstanding entry if the user reopens later.
      dispatch(clearOutstandingRequest(composedHash))
    }
    await respondWithReject()
  }

  // Compose draft on mount. Track the in-flight hash locally so the cleanup can GC orphans
  // when the effect is cancelled (re-render / unmount) after composeSafeTxDraft already
  // dispatched setDraft but before composedHash state caught up.
  useEffect(() => {
    if (!activeSafe || !calls || !safe) {
      return
    }
    let cancelled = false
    let inFlightHash: string | null = null
    setComposing(true)
    composeSafeTxDraft({
      calls,
      chainId: activeSafe.chainId,
      safeAddress: activeSafe.address,
      safe,
      dispatch,
    })
      .then((hash) => {
        inFlightHash = hash
        if (!cancelled) {
          setComposedHash(hash)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          Alert.alert('Failed to build transaction', e instanceof Error ? e.message : 'Unknown error')
          void onReject()
        }
      })
      .finally(() => {
        if (!cancelled) {
          setComposing(false)
        }
      })
    return () => {
      cancelled = true
      // If the draft landed in the store but we never handed it off, GC it.
      if (inFlightHash && !handedOffRef.current) {
        dispatch(clearDraft(inFlightHash))
        dispatch(clearOutstandingRequest(inFlightHash))
      }
    }
  }, [activeSafe?.address, activeSafe?.chainId, calls, dispatch, safe])

  const onSign = async () => {
    if (!composedHash) {
      return
    }
    // Hand off to review-and-confirm. The dApp response is sent later by the propose-success
    // listener in WalletKitProvider, NOT here — the user hasn't actually signed yet.
    if (pending.method === 'eth_sendTransaction' || pending.method === 'wallet_sendCalls') {
      dispatch(
        setOutstandingRequest({
          safeTxHash: composedHash,
          topic: pending.topic,
          id: pending.id,
          method: pending.method,
        }),
      )
    }
    handedOffRef.current = true // tell the cleanup effect to leave the draft alone
    dispatch(removePending({ id: pending.id, kind: 'request' }))
    router.push({ pathname: '/review-and-confirm', params: { txId: composedHash } })
  }

  // Secondary GC for the path where composedHash was already in state at unmount — covers
  // explicit Reject (which sets composedHash before clearing) and dApp-side session_delete.
  useEffect(() => {
    return () => {
      if (composedHash && !handedOffRef.current) {
        dispatch(clearDraft(composedHash))
        dispatch(clearOutstandingRequest(composedHash))
      }
    }
  }, [composedHash, dispatch])

  if (!calls) {
    return (
      <YStack gap="$3" padding="$4">
        <Text>Invalid dApp request</Text>
        <Button onPress={onReject}>Close</Button>
      </YStack>
    )
  }

  return (
    <YStack gap="$3" padding="$4">
      <Text fontWeight="600">dApp transaction</Text>
      <Text color="$colorSecondary">
        {calls.length} call{calls.length > 1 ? 's' : ''}
      </Text>
      <YStack gap="$2">
        {calls.map((c, i) => (
          <YStack key={i} gap="$1" padding="$2" borderRadius="$2" backgroundColor="$backgroundSecondary">
            <Text fontWeight="500">to: {c.to}</Text>
            <Text color="$colorSecondary">value: {c.value ?? '0'}</Text>
            <Text color="$colorSecondary" numberOfLines={1}>
              data: {c.data ?? '0x'}
            </Text>
          </YStack>
        ))}
      </YStack>
      <XStack gap="$3">
        <Button flex={1} borderWidth={1} onPress={onReject} disabled={composing}>
          Reject
        </Button>
        <Button flex={1} onPress={onSign} disabled={composing || !composedHash}>
          {composing ? 'Preparing…' : 'Sign'}
        </Button>
      </XStack>
    </YStack>
  )
}
