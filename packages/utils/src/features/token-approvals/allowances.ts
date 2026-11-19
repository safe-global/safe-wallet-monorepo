import { type AbstractProvider, decodeBytes32String } from 'ethers'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { multicall, type Aggregate3Response } from '@safe-global/utils/utils/multicall'
import { isUnlimitedApproval } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { getApprovalKey, type ApprovalRecord, type ApprovalTokenInfo } from './approvalHistory'

/** A live allowance the Safe has granted, read on-chain at the latest block */
export type TokenApproval = {
  key: string
  token: ApprovalTokenInfo
  spender: ApprovalRecord['spender']
  allowance: bigint
  isUnlimited: boolean
  lastApproval: Pick<ApprovalRecord, 'txHash' | 'timestamp'>
}

const ERC20_INTERFACE = ERC20__factory.createInterface()
const MULTICALL_CHUNK_SIZE = 150

type TokenMetadata = { symbol?: string; decimals?: number; totalSupply?: bigint }

const decodeResult = <T>(response: Aggregate3Response | undefined, decode: (data: string) => T): T | undefined => {
  if (!response?.success || response.returnData === '0x') return undefined
  try {
    return decode(response.returnData)
  } catch {
    return undefined
  }
}

// Some older tokens (e.g. MKR) return `symbol` as bytes32
const decodeSymbol = (data: string): string => {
  try {
    return ERC20_INTERFACE.decodeFunctionResult('symbol', data)[0]
  } catch {
    return decodeBytes32String(data)
  }
}

const chunkedMulticall = async (provider: AbstractProvider, calls: { to: string; data: string }[]) => {
  const results: Aggregate3Response[] = []
  for (let i = 0; i < calls.length; i += MULTICALL_CHUNK_SIZE) {
    results.push(...(await multicall(provider, calls.slice(i, i + MULTICALL_CHUNK_SIZE))))
  }
  return results
}

const readTokenMetadata = async (provider: AbstractProvider, tokens: string[]): Promise<Map<string, TokenMetadata>> => {
  const calls = tokens.flatMap((to) => [
    { to, data: ERC20_INTERFACE.encodeFunctionData('symbol') },
    { to, data: ERC20_INTERFACE.encodeFunctionData('decimals') },
    { to, data: ERC20_INTERFACE.encodeFunctionData('totalSupply') },
  ])
  const results = await chunkedMulticall(provider, calls)

  return new Map(
    tokens.map((token, i) => {
      const [symbol, decimals, totalSupply] = results.slice(i * 3, i * 3 + 3)
      return [
        token.toLowerCase(),
        {
          symbol: decodeResult(symbol, decodeSymbol),
          decimals: decodeResult(decimals, (data) => Number(ERC20_INTERFACE.decodeFunctionResult('decimals', data)[0])),
          totalSupply: decodeResult(
            totalSupply,
            (data) => ERC20_INTERFACE.decodeFunctionResult('totalSupply', data)[0],
          ),
        },
      ]
    }),
  )
}

// An allowance above the total supply can never run out, which is how revoke.cash labels "unlimited" too
const isEffectivelyUnlimited = (allowance: bigint, totalSupply?: bigint): boolean =>
  isUnlimitedApproval(allowance) || (totalSupply !== undefined && totalSupply > 0n && allowance > totalSupply)

const compareApprovals = (a: TokenApproval, b: TokenApproval): number =>
  Number(b.isUnlimited) - Number(a.isUnlimited) || b.lastApproval.timestamp - a.lastApproval.timestamp

/** Live allowances of the given pairs, dropping spent ones and contracts with no ERC-20 `allowance` */
export const readTokenApprovals = async (
  provider: AbstractProvider,
  safeAddress: string,
  records: ApprovalRecord[],
): Promise<TokenApproval[]> => {
  if (records.length === 0) return []

  const allowanceResults = await chunkedMulticall(
    provider,
    records.map((record) => ({
      to: record.token.value,
      data: ERC20_INTERFACE.encodeFunctionData('allowance', [safeAddress, record.spender.value]),
    })),
  )

  const live = records.flatMap((record, i) => {
    const allowance = decodeResult(
      allowanceResults[i],
      (data) => ERC20_INTERFACE.decodeFunctionResult('allowance', data)[0] as bigint,
    )
    return allowance ? [{ record, allowance }] : []
  })

  const tokens = [...new Set(live.map(({ record }) => record.token.value))]
  const metadata = await readTokenMetadata(provider, tokens)

  return live
    .map(({ record, allowance }) => {
      const tokenMetadata = metadata.get(record.token.value.toLowerCase())
      return {
        key: getApprovalKey(record),
        token: {
          ...record.token,
          symbol: record.token.symbol ?? tokenMetadata?.symbol,
          // `decimals()` is optional in ERC-20, so a token without it is listed in whole units
          decimals: record.token.decimals ?? tokenMetadata?.decimals ?? 0,
        },
        spender: record.spender,
        allowance,
        isUnlimited: isEffectivelyUnlimited(allowance, tokenMetadata?.totalSupply),
        lastApproval: { txHash: record.txHash, timestamp: record.timestamp },
      }
    })
    .sort(compareApprovals)
}
