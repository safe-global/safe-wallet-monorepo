import { LoadingScreen } from '@/src/components/LoadingScreen'
import React, { useCallback, useLayoutEffect } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useLocalSearchParams } from 'expo-router'
import { useLazySignTransactionQuery } from '@/src/store/signersBalance'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import SignError from './SignError'
import SignSuccess from './SignSuccess'

export function SignTransaction() {
  const { txId, signerAddress } = useLocalSearchParams<{ txId: string; signerAddress: string }>()
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const [trigger, { isFetching, data, isError }] = useLazySignTransactionQuery()

  const sign = useCallback(async () => {
    const privateKey = await getPrivateKey(signerAddress)

    trigger({
      chain: activeChain as ChainInfo,
      activeSafe,
      txId,
      privateKey,
    })
  }, [activeChain, activeSafe, txId, signerAddress])

  useLayoutEffect(() => {
    sign()
  }, [sign])

  if (isError) {
    return <SignError onRetryPress={sign} />
  }

  if (isFetching || !data) {
    return <LoadingScreen title="Signing transaction..." description="It may take a few seconds..." />
  }

  return <SignSuccess />
}
