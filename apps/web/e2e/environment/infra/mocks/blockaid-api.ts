/**
 * Answers the gateway's Blockaid calls (BLOCKAID_BASE_URL) in place of the hosted API.
 *
 * The gateway scans a Safe transaction as its EIP-712 typed data (`eth_signTypedData_v4`) and the owners' Safes
 * with the address bulk scan. The verdict depends only on the request: a transaction that names
 * DRAINER_ADDRESS is malicious, one that names SCAN_ERROR_ADDRESS fails to scan, and anything else is benign.
 */
import { DRAINER_ADDRESS, SCAN_ERROR_ADDRESS } from './blockaid-addresses.ts'
import { isMain, json, serve } from './http.ts'
import type { MockRequest, Reply } from './http.ts'

const PORT = 8095
const TRANSACTION_SCAN = '/v0/evm/json-rpc/scan'
const ADDRESS_BULK_SCAN = '/v0/evm/address-bulk/scan'
const SIGN_TYPED_DATA = 'eth_signTypedData_v4'

type Verdict = 'Benign' | 'Malicious' | 'Error'
type BlockaidRequest = Pick<MockRequest, 'method' | 'path' | 'headers' | 'body'>
type TransactionScan = { chain: string; accountAddress?: string; typedData: string }
type AddressScan = { addresses: string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body)
  } catch {
    return undefined
  }
}

function parseTransactionScan(body: unknown): TransactionScan | null {
  if (!isRecord(body) || typeof body.chain !== 'string' || !isRecord(body.data)) return null
  const { method, params } = body.data
  if (method !== SIGN_TYPED_DATA || !Array.isArray(params) || typeof params[1] !== 'string') return null
  if (!isRecord(parseJson(params[1]))) return null
  const accountAddress = typeof body.account_address === 'string' ? body.account_address : undefined
  return { chain: body.chain, accountAddress, typedData: params[1] }
}

function parseAddressScan(body: unknown): AddressScan | null {
  if (!isRecord(body) || typeof body.chain !== 'string' || !Array.isArray(body.addresses)) return null
  const { addresses } = body
  return addresses.every((address) => typeof address === 'string') ? { addresses } : null
}

/** Finds an address in the typed data, as the recipient (`to`) or inside the calldata. */
function names(typedData: string, address: string): boolean {
  return typedData.toLowerCase().includes(address.slice(2).toLowerCase())
}

function verdictOf(typedData: string): Verdict {
  if (names(typedData, SCAN_ERROR_ADDRESS)) return 'Error'
  if (names(typedData, DRAINER_ADDRESS)) return 'Malicious'
  return 'Benign'
}

// The shapes of the SDK's JsonRpcScanResponse validation that the gateway reads.
function validationOf(verdict: Verdict): Record<string, unknown> {
  if (verdict === 'Error') {
    return {
      status: 'Success',
      result_type: 'Error',
      classification: '',
      description: '',
      reason: '',
      error: 'Transaction scan failed',
      features: [],
    }
  }
  if (verdict === 'Malicious') {
    return {
      status: 'Success',
      result_type: 'Malicious',
      reason: 'raw_ether_transfer',
      classification: 'drainer_contract',
      features: [
        {
          type: 'Malicious',
          feature_id: 'KNOWN_DRAINER',
          description: 'This address shows a wallet drainer behavior or patterns',
          address: DRAINER_ADDRESS,
        },
      ],
    }
  }
  return { status: 'Success', result_type: 'Benign', classification: '', reason: '', features: [] }
}

function scanTransaction({ chain, accountAddress, typedData }: TransactionScan): Reply {
  const verdict = verdictOf(typedData)
  const simulation = verdict === 'Error' ? undefined : { status: 'Success', assets_diffs: {} }
  return json(200, {
    block: '0',
    chain,
    account_address: accountAddress,
    validation: validationOf(verdict),
    simulation,
  })
}

function scanAddresses({ addresses }: AddressScan): Reply {
  const verdicts = addresses.map((address) => [
    address,
    address.toLowerCase() === DRAINER_ADDRESS ? 'Malicious' : 'Benign',
  ])
  return json(200, Object.fromEntries(verdicts))
}

function rejection(status: number, message: string): Reply {
  return json(status, { error: message })
}

export function dispatch({ method, path, headers, body }: BlockaidRequest): Reply {
  if (path === '/health') return json(200, { ready: true })
  if (method !== 'POST' || (path !== TRANSACTION_SCAN && path !== ADDRESS_BULK_SCAN)) {
    return rejection(404, 'No Blockaid fixture')
  }
  if (!headers['x-api-key']) return rejection(401, 'Set BLOCKAID_CLIENT_API_KEY')
  const payload = parseJson(body)
  if (path === TRANSACTION_SCAN) {
    const scan = parseTransactionScan(payload)
    return scan ? scanTransaction(scan) : rejection(400, `Expected a ${SIGN_TYPED_DATA} scan with typed data`)
  }
  const scan = parseAddressScan(payload)
  return scan ? scanAddresses(scan) : rejection(400, 'Expected a chain and a list of addresses')
}

if (isMain(import.meta.url)) serve(PORT, dispatch)
