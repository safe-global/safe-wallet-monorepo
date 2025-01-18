import { useEffect, useMemo } from 'react'
import type { BigNumber, providers } from 'ethers'
import type Safe from '@safe-global/safe-core-sdk'
import { encodeSignatures } from '@/services/tx/encodeSignatures'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { OperationType } from '@safe-global/safe-core-sdk-types'
import useAsync from '@/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import chains from '@/config/chains'
import useSafeAddress from './useSafeAddress'
import useWallet from './wallets/useWallet'
import { useSafeSDK } from './coreSDK/safeCoreSDK'
import useIsSafeOwner from './useIsSafeOwner'
import { Errors, logError } from '@/services/exceptions'
import { useHsgAddress, useTimelockAddress } from '@/hooks/hsgsuper/hsgsuper'
import { HsgsupermodAbi__factory as HsgsupermodFactory } from 'src/types/contracts/hsgsuper/factories/HsgsupermodAbi__factory'

const getEncodedSafeTx = (safeSDK: Safe, safeTx: SafeTransaction, from?: string): string => {
  const EXEC_TX_METHOD = 'execTransaction'

  return safeSDK
    .getContractManager()
    .safeContract.encode(EXEC_TX_METHOD, [
      safeTx.data.to,
      safeTx.data.value,
      safeTx.data.data,
      safeTx.data.operation,
      safeTx.data.safeTxGas,
      safeTx.data.baseGas,
      safeTx.data.gasPrice,
      safeTx.data.gasToken,
      safeTx.data.refundReceiver,
      encodeSignatures(safeTx, from),
    ])
}

const getEncodedTx = (
  safeSDK: Safe,
  safeTx: SafeTransaction,
  isScheduling: boolean,
  hsgAdd: string,
  provider: providers.Provider,
  from?: string,
): string => {
  const EXEC_TX_METHOD = 'executeTimelockTransaction'
  const SCHED_TX_METHOD = 'scheduleTransaction'

  const contract = HsgsupermodFactory.connect(hsgAdd, provider)

  return isScheduling
    ? contract.interface.encodeFunctionData(SCHED_TX_METHOD, [
        safeTx.data.to,
        safeTx.data.value,
        safeTx.data.data,
        safeTx.data.operation,
        safeTx.data.safeTxGas,
        safeTx.data.baseGas,
        safeTx.data.gasPrice,
        safeTx.data.gasToken,
        safeTx.data.refundReceiver,
        encodeSignatures(safeTx, from),
      ])
    : contract.interface.encodeFunctionData(EXEC_TX_METHOD, [
        safeTx.data.to,
        safeTx.data.value,
        safeTx.data.data,
        safeTx.data.operation,
        safeTx.data.safeTxGas,
        safeTx.data.baseGas,
        safeTx.data.gasPrice,
        safeTx.data.gasToken,
        safeTx.data.refundReceiver,
        encodeSignatures(safeTx, from),
      ])
}

const incrementByPercentage = (value: BigNumber, percentage: number): BigNumber => {
  return value.mul(100 + percentage).div(100)
}

export const useGasLimit = (
  safeTx?: SafeTransaction,
): {
  gasLimit?: BigNumber
  gasLimitError?: Error
  gasLimitLoading: boolean
} => {
  const safeSDK = useSafeSDK()
  const web3ReadOnly = useWeb3ReadOnly()
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const walletAddress = wallet?.address
  const isOwner = useIsSafeOwner()
  const currentChainId = useChainId()
  const timelock = useTimelockAddress()
  const hasSafeTxGas = !!safeTx?.data?.safeTxGas

  const encodedSafeTx = useMemo<string>(() => {
    if (!safeTx || !safeSDK || !walletAddress) {
      return ''
    }
    return getEncodedSafeTx(safeSDK, safeTx, isOwner ? walletAddress : undefined)
  }, [safeSDK, safeTx, walletAddress, isOwner])

  const operationType = useMemo<number>(
    () => (safeTx?.data.operation == OperationType.DelegateCall ? 1 : 0),
    [safeTx?.data.operation],
  )

  const [gasLimit, gasLimitError, gasLimitLoading] = useAsync<BigNumber>(() => {
    if (!safeAddress || !walletAddress || !encodedSafeTx || !web3ReadOnly || !timelock) return

    return web3ReadOnly
      .estimateGas({
        to: safeAddress,
        from: timelock, // this should be the timelock address
        data: encodedSafeTx,
        type: operationType,
      })
      .then((gasLimit) => {
        // Due to a bug in Nethermind estimation, we need to increment the gasLimit by 30%
        // when the safeTxGas is defined and not 0. Currently Nethermind is used only for Gnosis Chain.
        if (currentChainId === chains.gno && hasSafeTxGas) {
          const incrementPercentage = 30 // value defined in %, ex. 30%
          return incrementByPercentage(gasLimit, incrementPercentage)
        }

        return gasLimit
      })
  }, [currentChainId, safeAddress, hasSafeTxGas, walletAddress, encodedSafeTx, web3ReadOnly, operationType, timelock])

  useEffect(() => {
    if (gasLimitError) {
      logError(Errors._612, gasLimitError.message)
    }
  }, [gasLimitError])

  return { gasLimit, gasLimitError, gasLimitLoading }
}

// Chase
// Checks the gas for processing safe tx through timelock
export const useHsgGasLimit = ({
  safeTx,
  isScheduling,
}: {
  safeTx?: SafeTransaction
  isScheduling?: boolean
}): {
  gasLimit?: BigNumber
  gasLimitError?: Error
  gasLimitLoading: boolean
} => {
  const safeSDK = useSafeSDK()
  const web3ReadOnly = useWeb3ReadOnly()
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const walletAddress = wallet?.address
  const isOwner = useIsSafeOwner()
  const currentChainId = useChainId()
  const timelock = useTimelockAddress()
  const hsg = useHsgAddress()
  const hasSafeTxGas = !!safeTx?.data?.safeTxGas

  const encodedTx = useMemo<string>(() => {
    if (!safeTx || !safeSDK || !walletAddress || !web3ReadOnly || typeof isScheduling === 'undefined' || !hsg) {
      return ''
    }
    return getEncodedTx(safeSDK, safeTx, isScheduling, hsg, web3ReadOnly, isOwner ? walletAddress : undefined)
  }, [safeSDK, safeTx, walletAddress, isOwner, web3ReadOnly, isScheduling, hsg])

  const operationType = useMemo<number>(
    () => (safeTx?.data.operation == OperationType.DelegateCall ? 1 : 0),
    [safeTx?.data.operation],
  )

  const [gasLimit, gasLimitError, gasLimitLoading] = useAsync<BigNumber>(() => {
    if (!safeAddress || !walletAddress || !encodedTx || !web3ReadOnly || !hsg) return

    return web3ReadOnly
      .estimateGas({
        to: hsg,
        from: walletAddress,
        data: encodedTx,
        type: operationType,
      })
      .then((gasLimit) => {
        // Due to a bug in Nethermind estimation, we need to increment the gasLimit by 30%
        // when the safeTxGas is defined and not 0. Currently Nethermind is used only for Gnosis Chain.
        if (currentChainId === chains.gno && hasSafeTxGas) {
          const incrementPercentage = 30 // value defined in %, ex. 30%
          return incrementByPercentage(gasLimit, incrementPercentage)
        }

        return gasLimit
      })
  }, [currentChainId, safeAddress, hasSafeTxGas, walletAddress, encodedTx, web3ReadOnly, operationType, hsg])

  useEffect(() => {
    if (gasLimitError) {
      logError(Errors._612, gasLimitError.message)
    }
  }, [gasLimitError])

  return { gasLimit, gasLimitError, gasLimitLoading }
}
