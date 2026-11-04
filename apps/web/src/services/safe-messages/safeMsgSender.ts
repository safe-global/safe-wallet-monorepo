import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Eip1193Provider } from 'ethers'
import { buildSignatureBytes, EthSafeSignature } from '@safe-global/protocol-kit'

import { safeMsgDispatch, SafeMsgEvent } from './safeMsgEvents'
import {
  generateSafeMessageHash,
  isEIP712TypedData,
  tryOffChainMsgSigning,
} from '@safe-global/utils/utils/safe-messages'
import { normalizeTypedData } from '@safe-global/utils/utils/web3'
import { getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getStoreInstance } from '@/store'

/**
 * Signs the message with the connected signer. A Safe signer's signature only validates through EIP-1271,
 * so it is encoded as a contract signature of that Safe.
 */
const signMessage = async (
  provider: Eip1193Provider,
  safe: SafeState,
  message: MessageItem['message'],
  safeSignerAddress: string | undefined,
): Promise<string> => {
  const signer = await getAssertedChainSigner(provider)
  const signature = await tryOffChainMsgSigning(signer, safe, message)
  if (!safeSignerAddress) return signature
  return buildSignatureBytes([new EthSafeSignature(safeSignerAddress, signature, true)])
}

export const dispatchSafeMsgProposal = async ({
  provider,
  safe,
  message,
  origin = '',
  safeSignerAddress,
}: {
  provider: Eip1193Provider
  safe: SafeState
  message: MessageItem['message']
  origin: string | undefined
  /** The signer's address when the signer is itself a Safe */
  safeSignerAddress?: string
}): Promise<void> => {
  const messageHash = generateSafeMessageHash(safe, message)

  try {
    const signature = await signMessage(provider, safe, message, safeSignerAddress)

    let normalizedMessage = message
    if (isEIP712TypedData(message)) {
      normalizedMessage = normalizeTypedData(message)
    }

    // Use RTK Query mutation to propose message
    const store = getStoreInstance()
    const result = await store.dispatch(
      cgwApi.endpoints.messagesCreateMessageV1.initiate({
        chainId: safe.chainId,
        safeAddress: safe.address.value,
        createMessageDto: {
          message: normalizedMessage,
          signature,
          origin: origin || null,
        },
      }),
    )

    if ('error' in result) {
      throw asError(result.error)
    }
  } catch (error) {
    safeMsgDispatch(SafeMsgEvent.PROPOSE_FAILED, {
      messageHash,
      error: asError(error),
    })

    throw error
  }

  safeMsgDispatch(SafeMsgEvent.PROPOSE, {
    messageHash,
  })
}

export const dispatchSafeMsgConfirmation = async ({
  provider,
  safe,
  message,
  safeSignerAddress,
}: {
  provider: Eip1193Provider
  safe: SafeState
  message: MessageItem['message']
  /** The signer's address when the signer is itself a Safe */
  safeSignerAddress?: string
}): Promise<void> => {
  const messageHash = generateSafeMessageHash(safe, message)

  try {
    const signature = await signMessage(provider, safe, message, safeSignerAddress)

    // Use RTK Query mutation to confirm message
    const store = getStoreInstance()
    const result = await store.dispatch(
      cgwApi.endpoints.messagesUpdateMessageSignatureV1.initiate({
        chainId: safe.chainId,
        messageHash,
        updateMessageSignatureDto: {
          signature,
        },
      }),
    )

    if ('error' in result) {
      throw asError(result.error)
    }
  } catch (error) {
    safeMsgDispatch(SafeMsgEvent.CONFIRM_PROPOSE_FAILED, {
      messageHash,
      error: asError(error),
    })

    throw error
  }

  safeMsgDispatch(SafeMsgEvent.CONFIRM_PROPOSE, {
    messageHash,
  })
}
