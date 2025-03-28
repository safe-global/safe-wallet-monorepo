import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { JsonRpcSigner } from 'ethers'
import { TypedDataEncoder } from 'ethers'
import type { TypedDataDomain } from 'ethers'
import { adjustVInSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import { SigningMethod } from '@safe-global/protocol-kit'

export const hashTypedData = (typedData: TypedData): string => {
  // `ethers` doesn't require `EIP712Domain` and otherwise throws
  const { EIP712Domain: _, ...types } = typedData.types
  return TypedDataEncoder.hash(typedData.domain as TypedDataDomain, types, typedData.message)
}

export const normalizeTypedData = (typedData: TypedData): TypedData => {
  const { EIP712Domain: _, ...types } = typedData.types
  const payload = TypedDataEncoder.getPayload(typedData.domain as TypedDataDomain, types, typedData.message)

  // ethers v6 converts the chainId to a hex value:
  // https://github.com/ethers-io/ethers.js/blob/50b74b8806ef2064f2764b09f89c7ac75fda3a3c/src.ts/hash/typed-data.ts#L75
  // Our SDK expects a number, that's why we convert it here
  // If this gets fixed here: https://github.com/safe-global/safe-eth-py/issues/748
  // we can remove this workaround
  if (payload.domain.chainId) {
    payload.domain.chainId = Number(BigInt(payload.domain.chainId))
  }

  return payload
}

// Fall back to `eth_signTypedData` for Ledger that doesn't support `eth_signTypedData_v4`
const signTypedDataFallback = async (signer: JsonRpcSigner, typedData: TypedData): Promise<string> => {
  return await signer.provider.send('eth_signTypedData', [
    signer.address.toLowerCase(),
    TypedDataEncoder.getPayload(typedData.domain as TypedDataDomain, typedData.types, typedData.message),
  ])
}

export const signTypedData = async (signer: JsonRpcSigner, typedData: TypedData): Promise<string> => {
  const UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION'
  let signature = ''
  try {
    const { domain, types, message } = typedData
    signature = await signer.signTypedData(domain as TypedDataDomain, types, message)
  } catch (e) {
    if ((e as Error & { code: string }).code === UNSUPPORTED_OPERATION) {
      signature = await signTypedDataFallback(signer, typedData)
    } else {
      throw e
    }
  }
  return adjustVInSignature(SigningMethod.ETH_SIGN_TYPED_DATA, signature)
}
