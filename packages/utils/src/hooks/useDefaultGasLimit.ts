import { useEffect } from 'react'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { type JsonRpcProvider } from 'ethers'
import chains from '../config/chains'
import {
  getEncodedSafeTx,
  GasMultipliers,
  incrementByGasMultiplier,
  getGasLimitForZkSync,
} from './coreSDK/gasLimitUtils'

interface useGasLimitParams {
  chainId: string
  safeSDK?: Safe
  web3ReadOnly?: JsonRpcProvider
  isOwner: boolean
  safeAddress: string
  walletAddress: string
  logError?: (err: string) => void
  safeTx?: SafeTransaction
  threshold: number
}

type useGasLimitResult = {
  gasLimit?: bigint
  gasLimitError?: Error
  gasLimitLoading: boolean
}

export const useGasLimit = ({
  chainId,
  safeSDK,
  web3ReadOnly,
  isOwner,
  safeAddress,
  walletAddress,
  logError,
  safeTx,
  threshold,
}: useGasLimitParams): useGasLimitResult => {
  const hasSafeTxGas = !!safeTx?.data?.safeTxGas

  const [gasLimit, gasLimitError, gasLimitLoading] = useAsync<bigint | undefined>(async () => {
    if (!safeAddress || !walletAddress || !safeSDK || !web3ReadOnly || !safeTx) return

    const encodedSafeTx = getEncodedSafeTx(
      safeSDK,
      safeTx,
      isOwner ? walletAddress : undefined,
      safeTx.signatures.size < threshold,
    )

    // if we are dealing with zksync and the walletAddress is a Safe, we have to do some magic
    // FIXME a new check to indicate ZKsync chain will be added to the config service and available under ChainInfo
    if (
      (chainId === chains.zksync || chainId === chains.lens) &&
      (await web3ReadOnly.getCode(walletAddress)) !== '0x'
    ) {
      return getGasLimitForZkSync(web3ReadOnly, safeSDK, safeTx, chainId, safeAddress)
    }

    return web3ReadOnly
      .estimateGas({
        to: safeAddress,
        from: walletAddress,
        data: encodedSafeTx,
      })
      .then((gasLimit) => {
        // Due to a bug in Nethermind estimation, we need to increment the gasLimit by 30%
        // when the safeTxGas is defined and not 0. Currently Nethermind is used only for Gnosis Chain.
        if (chainId === chains.gno && hasSafeTxGas) {
          return incrementByGasMultiplier(gasLimit, GasMultipliers[chains.gno])
        }

        return gasLimit
      })
  }, [safeAddress, walletAddress, safeSDK, web3ReadOnly, safeTx, isOwner, hasSafeTxGas, threshold, chainId])

  useEffect(() => {
    if (gasLimitError && logError) {
      logError(gasLimitError.message)
    }
  }, [gasLimitError])

  return { gasLimit, gasLimitError, gasLimitLoading }
}
