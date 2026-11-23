import { GATEWAY_URL } from '@/config/gateway'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { gatewayApi } from '@/store/api/gateway'

export type TokenApprovalTokenMetadata = {
  address: string
  decimals: number
  logoUri: string
  name: string
  symbol: string
  trusted: boolean
  type: 'ERC20'
}

export type TokenApproval = {
  tokenAddress: string
  tokenMetadata: TokenApprovalTokenMetadata | null
  spender: string
  /** In the token's base units. */
  allowance: string
}

export type TokenApprovals = {
  approvals: TokenApproval[]
  /** False when the gateway could not make sure that it found every approval. */
  isComplete: boolean
}

export type TokenApprovalsArgs = { chainId: string; safeAddress: string }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isTokenApproval = (value: unknown): value is TokenApproval =>
  isObject(value) &&
  typeof value.tokenAddress === 'string' &&
  typeof value.spender === 'string' &&
  typeof value.allowance === 'string' &&
  /^\d+$/.test(value.allowance) &&
  (value.tokenMetadata === null || isObject(value.tokenMetadata))

const isTokenApprovals = (value: unknown): value is TokenApprovals =>
  isObject(value) &&
  typeof value.isComplete === 'boolean' &&
  Array.isArray(value.approvals) &&
  value.approvals.every(isTokenApproval)

/** Not in the generated client yet: the open ERC-20 approvals of a Safe, put together by the gateway in one request. */
export const tokenApprovalsApi = gatewayApi.injectEndpoints({
  endpoints: (builder) => ({
    getTokenApprovals: builder.query<TokenApprovals, TokenApprovalsArgs>({
      async queryFn({ chainId, safeAddress }) {
        try {
          const response = await fetch(`${GATEWAY_URL}/v1/chains/${chainId}/safes/${safeAddress}/token-approvals`)

          if (!response.ok) {
            return { error: new Error(`Token approvals failed with status ${response.status}`) }
          }

          const body: unknown = await response.json()
          if (!isTokenApprovals(body)) {
            return { error: new Error('Token approvals response did not match expected shape') }
          }

          return { data: body }
        } catch (error) {
          return { error: asError(error) }
        }
      },
    }),
  }),
})

export const { useGetTokenApprovalsQuery } = tokenApprovalsApi
