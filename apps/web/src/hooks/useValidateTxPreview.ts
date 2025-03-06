import { logError } from '@/services/exceptions'
import ErrorCodes from '@/services/exceptions/ErrorCodes'
import { asError } from '@/services/exceptions/utils'
import { sameAddress } from '@/utils/addresses'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { type TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import { Interface } from 'ethers'

export const InvalidPreviewErrorName = 'InvalidPreviewError'
class InvalidPreviewError extends Error {
  constructor(message: string) {
    super(message)

    this.name = InvalidPreviewErrorName
  }
}

export const useValidateTxPreview = (
  txPreview: TransactionPreview | undefined,
  safeTxData: SafeTransaction['data'] | undefined,
): Error | undefined => {
  if (!txPreview || !safeTxData) {
    return
  }

  try {
    // Validate that the tx preview matches the txData
    // First of all the top level data needs to match:
    const matchesSafeTxData =
      sameAddress(txPreview.txData.to.value, safeTxData.to) &&
      Number(txPreview.txData.operation) === Number(safeTxData.operation) &&
      txPreview.txData.value === safeTxData.value &&
      (txPreview.txData.hexData ?? '0x') === safeTxData.data

    if (!matchesSafeTxData) {
      return new InvalidPreviewError("SafeTx data does not match the preview result's transaction data")
    }

    // validate the decodedData
    const dataDecoded = txPreview.txData.dataDecoded

    if (dataDecoded) {
      // Fallback functions are special as they are called for all data that does not match any other function
      if (dataDecoded.method === 'fallback') {
        return
      }
      const abiString = `function ${dataDecoded.method}(${dataDecoded.parameters?.map((param) => param.type).join(',')})`
      const abiInterface = new Interface([abiString])
      const rawDataFromDecodedData = abiInterface.encodeFunctionData(
        dataDecoded.method,
        dataDecoded.parameters?.map((param) => param.value),
      )

      if (rawDataFromDecodedData !== safeTxData.data) {
        return new InvalidPreviewError('Decoded data does not match raw data')
      }
    }
  } catch (err) {
    const error = asError(err)
    logError(ErrorCodes._818, error)
    return error
  }
}
