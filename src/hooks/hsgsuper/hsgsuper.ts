import React, { useEffect, useState } from 'react'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import {
  DetailedExecutionInfoType,
  TransactionDetails,
  TransactionInfoType,
  TransactionTokenType,
} from '@safe-global/safe-gateway-typescript-sdk'
import { findModuleAddress, getProposalId } from '@/services/tx/hsgsuper'
import hsgsuperAbi from '@/services/tx/contracts/hsgsupermod.abi.json'
import timelockAbi from '@/services/tx/contracts/timelockcontroller.abi.json'
import { ethers } from 'ethers'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useAppSelector } from '@/store'
import { selectPendingTxById } from '@/store/pendingTxsSlice'

export const useTimelockAddress = (): string | undefined => {
  const [timelockAdd, setTimelockAdd] = useState<string | undefined>()
  const safeSdk = useSafeSDK()
  const provider = useWeb3ReadOnly()

  useEffect(() => {
    if (!safeSdk || !provider) return

    findModuleAddress(safeSdk).then(async (modAdd) => {
      const hsgsuper = new ethers.Contract(modAdd, hsgsuperAbi, provider)
      const _timelockAdd: string = await hsgsuper.timelock()
      setTimelockAdd(_timelockAdd)
    })
  }, [safeSdk, provider])
  return timelockAdd
}

export const useHsgAddress = (): string | undefined => {
  const [hsgAdd, setHsgAdd] = useState<string | undefined>()
  const safeSdk = useSafeSDK()
  const provider = useWeb3ReadOnly()

  useEffect(() => {
    if (!safeSdk || !provider) return

    findModuleAddress(safeSdk).then(async (modAdd) => {
      setHsgAdd(modAdd)
    })
  }, [safeSdk, provider])
  return hsgAdd
}

export const useTimelockStamp = (
  txDetails: TransactionDetails | undefined,
): { proposalId?: string; timeStamp?: number; err?: string } => {
  const [proposalId, setPId] = useState<string>()
  const [timeStamp, setTStamp] = useState<number>()
  const [err, setErr] = useState<string>()
  const provider = useWeb3ReadOnly()
  const safeSdk = useSafeSDK()

  const pendingTx = useAppSelector((state) => selectPendingTxById(state, txDetails?.txId ?? ''))

  useEffect(() => {
    if (!txDetails) {
      setErr('No txDetails')
      return
    }
    // if (txDetails.txInfo.type !== TransactionInfoType.TRANSFER) {
    //   setErr('Incorrect txInfo type')
    //   return
    // }
    // if (txDetails.txInfo.transferInfo.type !== TransactionTokenType.NATIVE_COIN) {
    //   setErr('Incorrect transferInfo type')
    //   return
    // }
    if (txDetails.detailedExecutionInfo?.type !== DetailedExecutionInfoType.MULTISIG) {
      setErr('Incorrect detailedExecInfo type')
      return
    }
    if (!txDetails.txData?.value) {
      setErr('No txData value')
      return
    }
    if (!provider) {
      setErr('No provider')
      return
    }
    if (!safeSdk) {
      setErr('No safeSdk')
      return
    }

    const proposalId = getProposalId(
      txDetails.safeAddress,
      txDetails.txData.to.value,
      txDetails.txData.value,
      txDetails.txData.hexData ?? null,
      txDetails.txData.operation,
      txDetails.detailedExecutionInfo.safeTxGas,
      txDetails.detailedExecutionInfo.baseGas,
      txDetails.detailedExecutionInfo.gasPrice,
      txDetails.detailedExecutionInfo.gasToken,
      txDetails.detailedExecutionInfo.refundReceiver.value,
      txDetails.detailedExecutionInfo.confirmations,
    )

    setPId(proposalId)

    findModuleAddress(safeSdk).then(async (modAdd) => {
      const hsgsuper = new ethers.Contract(modAdd, hsgsuperAbi, provider)
      const timelockAdd: string = await hsgsuper.timelock()
      const timelock = new ethers.Contract(timelockAdd, timelockAbi, provider)
      const timestamp = await timelock.getTimestamp(proposalId)
      console.log('Timestamp: ', timestamp)
      setTStamp(Number(timestamp.toString()) * 1000)
      setErr(undefined)
    })
  }, [txDetails, provider, safeSdk, pendingTx == undefined]) // there's probably a better way to guarantee this effect runs after this transaction is processed

  return { timeStamp, proposalId, err }
}

// this could be a general helper function really
// returns updating current timestamp in *seconds*
// gives a refresh rate in seconds
export const useNow = (refreshRate: number = 5000) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, refreshRate)
    return () => {
      clearInterval(timer)
    }
  })
  return now
}
