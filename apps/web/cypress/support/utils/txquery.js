/* eslint-disable */
import { stagingCGWUrlv1 } from '../constants'
export function buildQueryUrl({ chainId, safeAddress, transactionType, ...params }) {
  const baseUrlMap = {
    incoming: `${stagingCGWUrlv1}/chains/${chainId}/safes/${safeAddress}/incoming-transfers/`,
    multisig: `${stagingCGWUrlv1}/chains/${chainId}/safes/${safeAddress}/multisig-transactions/`,
    module: `${stagingCGWUrlv1}/chains/${chainId}/safes/${safeAddress}/module-transactions/`,
  }

  const defaultParams = {
    safe: `sep:${safeAddress}`,
    timezone: 'Europe/Berlin',
    trusted: 'false',
  }

  const paramMap = {
    startDate: 'execution_date__gte',
    endDate: 'execution_date__lte',
    value: 'value',
    tokenAddress: 'token_address',
    to: 'to',
    nonce: 'nonce',
    module: 'module',
  }

  const baseUrl = baseUrlMap[transactionType]
  if (!baseUrl) {
    throw new Error(`Unsupported transaction type: ${transactionType}`)
  }

  const mergedParams = { ...defaultParams, ...params }
  const queryString = Object.entries(mergedParams)
    .map(([key, value]) => `${paramMap[key] || key}=${value}`)
    .join('&')

  return baseUrl + '?' + queryString
}

export default {
  buildQueryUrl,
}
