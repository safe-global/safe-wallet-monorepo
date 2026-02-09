import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { HypernativeMessageAssessmentRequestDto } from '@safe-global/store/hypernative/hypernativeApi.dto'

type BuildHypernativeMessageRequestDataParams = {
  safeAddress: `0x${string}`
  messageHash: `0x${string}`
  typedData: TypedData
  proposer?: `0x${string}`
  origin?: string
}

/**
 * Builds a Hypernative EIP-712 message assessment request payload
 *
 * @param params - Parameters required to build the request
 * @returns HypernativeMessageAssessmentRequestDto or undefined if required data is missing
 */
export const buildHypernativeMessageRequestData = ({
  safeAddress,
  messageHash,
  typedData,
  proposer,
  origin,
}: BuildHypernativeMessageRequestDataParams): HypernativeMessageAssessmentRequestDto | undefined => {
  //TODO: Remove this after testing
  console.log('[buildHypernativeMessageRequestData] inputs:', {
    safeAddress,
    messageHash,
    typedData,
  })
  //TODO: Remove this after testing

  if (!safeAddress || !messageHash || !typedData) {
    console.log('[buildHypernativeMessageRequestData] missing required fields')
    return undefined
  }

  // Validate that typedData has required EIP-712 fields
  if (!typedData.types || !typedData.domain || !typedData.message /*|| !typedData.primaryType*/) {
    console.log('[buildHypernativeMessageRequestData] missing EIP-712 fields:', {
      hasTypes: !!typedData.types,
      hasDomain: !!typedData.domain,
      hasMessage: !!typedData.message,
      //hasPrimaryType: !!typedData.primaryType,
    })
    return undefined
  }

  // Ensure EIP712Domain is present in types
  const types = typedData.types.EIP712Domain
    ? typedData.types
    : {
        EIP712Domain: [],
        ...typedData.types,
      }

  return {
    safeAddress,
    messageHash,
    message: {
      types: types as HypernativeMessageAssessmentRequestDto['message']['types'],
      domain: typedData.domain as Record<string, unknown>,
      message: typedData.message as Record<string, unknown>,
      primaryType: typedData.primaryType,
    },
    ...(proposer ? { proposer } : {}),
    ...(origin ? { url: origin } : {}),
    chain: typedData.domain.chainId ? typedData.domain.chainId.toString() : '1',
  }
}
