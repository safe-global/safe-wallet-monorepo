import type { DataDecoded, InternalTransaction, TransactionData } from '@safe-global/safe-gateway-typescript-sdk'

export function isNestedSafeCreation(txData: TransactionData): boolean {
  try {
    _getFactoryAddressAndSetupData(txData)
    return true
  } catch {
    return false
  }
}

export function _getFactoryAddressAndSetupData(txData: TransactionData): {
  factoryAddress: string
  singleton: string
  initializer: string
  saltNonce: string
} {
  let factoryAddress: string | undefined
  let dataDecoded: DataDecoded | undefined

  if (isCreateProxyWithNonce(txData)) {
    factoryAddress = txData.to.value
    dataDecoded = txData.dataDecoded
  } else if (isMultiSend(txData)) {
    const batchTxData = txData.dataDecoded?.parameters
      ?.find((parameter) => parameter?.name === 'transactions')
      ?.valueDecoded?.find(isCreateProxyWithNonce)

    factoryAddress = batchTxData?.to
    dataDecoded = batchTxData?.dataDecoded
  } else {
    throw new Error('Invalid method')
  }

  if (!factoryAddress) {
    throw new Error('Missing factory address')
  }

  if (!Array.isArray(dataDecoded?.parameters)) {
    throw new Error('Invalid parameters')
  }

  const [singleton, initializer, saltNonce] = dataDecoded.parameters

  if (
    typeof singleton.value !== 'string' ||
    typeof initializer.value !== 'string' ||
    typeof saltNonce.value !== 'string'
  ) {
    throw new Error('Invalid parameter values')
  }

  return {
    factoryAddress,
    singleton: singleton.value,
    initializer: initializer.value,
    saltNonce: saltNonce.value,
  }
}

function isCreateProxyWithNonce(txData: TransactionData | InternalTransaction) {
  return txData.dataDecoded?.method === 'createProxyWithNonce'
}

function isMultiSend(txData: TransactionData) {
  return txData.dataDecoded?.method === 'multiSend'
}
