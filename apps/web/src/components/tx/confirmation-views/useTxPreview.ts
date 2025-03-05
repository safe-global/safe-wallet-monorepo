import { Operation, getTxPreview } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import useAsync from '@/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@/utils/addresses'
import { Interface } from 'ethers'

export const InvalidPreviewErrorName = 'InvalidPreviewError'
class InvalidPreviewError extends Error {
  constructor(message: string) {
    super(message)

    this.name = InvalidPreviewErrorName
  }
}

const useTxPreview = (
  safeTxData?: {
    operation: SafeTransaction['data']['operation']
    data: SafeTransaction['data']['data']
    value: SafeTransaction['data']['value']
    to: SafeTransaction['data']['to']
  },
  customSafeAddress?: string,
  txId?: string,
) => {
  const skip = !!txId || !safeTxData
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const address = customSafeAddress ?? safeAddress
  const { operation = Operation.CALL, data = '', to, value } = safeTxData ?? {}

  return useAsync(async () => {
    if (skip) return
    const txPreview = await getTxPreview(chainId, address, operation, data, to, value)

    // Validate that the tx preview matches the txData
    // First of all the top level data needs to match:
    const matchesSafeTxData =
      sameAddress(txPreview.txData.to.value, safeTxData.to) &&
      Number(txPreview.txData.operation) === Number(safeTxData.operation) &&
      txPreview.txData.value === safeTxData.value &&
      (txPreview.txData.hexData ?? '0x') === safeTxData.data

    if (!matchesSafeTxData) {
      throw new InvalidPreviewError("SafeTx data does not match the preview result's transaction data")
    }

    // validate the decodedData
    const dataDecoded = txPreview.txData.dataDecoded

    if (dataDecoded) {
      const abiString = `function ${dataDecoded.method}(${dataDecoded.parameters?.map((param) => param.type).join(',')})`
      const abiInterface = new Interface([abiString])
      const rawDataFromDecodedData = abiInterface.encodeFunctionData(
        dataDecoded.method,
        dataDecoded.parameters?.map((param) => param.value),
      )

      if (rawDataFromDecodedData !== safeTxData.data) {
        throw new InvalidPreviewError('Decoded data does not match raw data')
      }
    }

    return txPreview
  }, [skip, chainId, address, operation, data, to, value, safeTxData])
}

export default useTxPreview
