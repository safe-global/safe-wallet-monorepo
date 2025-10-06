import { SafeProvider } from '@safe-global/protocol-kit'
import { useEffect } from 'react'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { estimateTxBaseGas } from '@safe-global/protocol-kit/dist/src/utils/transactions/gas'
import {
  getCompatibilityFallbackHandlerContract,
  getSimulateTxAccessorContract,
} from '@safe-global/protocol-kit/dist/src/contracts/safeDeploymentContracts'
import { type JsonRpcProvider } from 'ethers'
import { encodeSignatures } from '../services/encodeSignatures'
import chains from '../config/chains'


const getEncodedSafeTx = (
  safeSDK: Safe,
  safeTx: SafeTransaction,
  from: string | undefined,
  needsSignature: boolean,
): string | undefined => {
  const EXEC_TX_METHOD = 'execTransaction'

  // @ts-ignore union type is too complex
  return safeSDK
    .getContractManager()
    .safeContract?.encode(EXEC_TX_METHOD, [
      safeTx.data.to,
      safeTx.data.value,
      safeTx.data.data,
      safeTx.data.operation,
      safeTx.data.safeTxGas,
      safeTx.data.baseGas,
      safeTx.data.gasPrice,
      safeTx.data.gasToken,
      safeTx.data.refundReceiver,
      encodeSignatures(safeTx, from, needsSignature),
    ])
}

const GasMultipliers = {
  [chains.gno]: 1.3,
  [chains.zksync]: 20,
}

const incrementByGasMultiplier = (value: bigint, multiplier: number) => {
  return (value * BigInt(100 * multiplier)) / BigInt(100)
}

/**
 * Estimates the gas limit for a transaction that will be executed on the zkSync network.
 *
 *  The rpc call for estimateGas is failing for the zkSync network, when the from address
 *  is a Safe. Quote from this discussion:
 *  https://github.com/zkSync-Community-Hub/zksync-developers/discussions/144
 *  ======================
 *  zkSync has native account abstraction and, under the hood, all accounts are a smart
 *  contract account. Even EOA use the DefaultAccount smart contract. All smart contract
 *  accounts on zkSync must be deployed using the createAccount or create2Account
 *  methods of the ContractDeployer system contract.
 *
 * When processing a transaction, the protocol checks the code of the from account and,
 * in this case, as Safe accounts are not deployed as native accounts on zkSync
 * (via createAccount or create2Account), it fails with the error above.
 * ======================
 *
 * We do some "magic" here by simulating the transaction on the SafeProxy contract
 *
 * @param safe
 * @param web3
 * @param safeSDK
 * @param safeTx
 */
const getGasLimitForZkSync = async (
  web3: JsonRpcProvider,
  safeSDK: Safe,
  safeTx: SafeTransaction,
  chainId: string,
  safeAddress: string,
) => {
  // use a random EOA address as the from address
  // https://github.com/zkSync-Community-Hub/zksync-developers/discussions/144
  const fakeEOAFromAddress = '0x330d9F4906EDA1f73f668660d1946bea71f48827'
  const customContracts = safeSDK.getContractManager().contractNetworks?.[chainId]
  const safeVersion = safeSDK.getContractVersion()
  const safeProvider = new SafeProvider({ provider: web3._getConnection().url })
  const fallbackHandlerContract = await getCompatibilityFallbackHandlerContract({
    safeProvider,
    safeVersion,
    customContracts,
  })

  const simulateTxAccessorContract = await getSimulateTxAccessorContract({
    safeProvider,
    safeVersion,
    customContracts,
  })

  // 2. Add a simulate call to the predicted SafeProxy as second transaction
  const transactionDataToEstimate: string = simulateTxAccessorContract.encode('simulate', [
    safeTx.data.to,
    // @ts-ignore
    safeTx.data.value,
    safeTx.data.data as `0x${string}`,
    safeTx.data.operation,
  ])

  const safeFunctionToEstimate: string = fallbackHandlerContract.encode('simulate', [
    simulateTxAccessorContract.getAddress(),
    transactionDataToEstimate as `0x${string}`,
  ])

  const gas = await web3.estimateGas({
    to: safeAddress,
    from: fakeEOAFromAddress,
    value: '0',
    data: safeFunctionToEstimate,
  })

  // The estimateTxBaseGas function seems to estimate too low for zkSync
  const baseGas = incrementByGasMultiplier(
    BigInt(await estimateTxBaseGas(safeSDK, safeTx)),
    GasMultipliers[chains.zksync],
  )

  return BigInt(gas) + baseGas
}

interface useGasLimitParams {
  chainId: string,
  safeSDK?: Safe,
  web3ReadOnly?: JsonRpcProvider,
  isOwner: boolean,
  safeAddress: string,
  walletAddress: string
  logError: (err: string) => void
  safeTx?: SafeTransaction,
  threshold: number,
}

type useGasLimitResult = {
  gasLimit?: bigint
  gasLimitError?: Error
  gasLimitLoading: boolean
}

export const useGasLimit = (
  {
    chainId,
    safeSDK,
    web3ReadOnly,
    isOwner,
    safeAddress,
    walletAddress,
    logError,
    safeTx,
    threshold
  }: useGasLimitParams ): useGasLimitResult => {
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
  }, [
    safeAddress,
    walletAddress,
    safeSDK,
    web3ReadOnly,
    safeTx,
    isOwner,
    hasSafeTxGas,
    threshold,
    chainId
  ])

  useEffect(() => {
    if (gasLimitError) {
    //   logError(Errors._612, gasLimitError.message)
    logError(gasLimitError.message)
    }
  }, [gasLimitError])

  return { gasLimit, gasLimitError, gasLimitLoading }
}