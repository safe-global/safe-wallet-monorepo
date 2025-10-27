import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Eip1193Provider } from 'ethers'

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

export const dispatchSafeMsgProposal = async ({
  provider,
  safe,
  message,
  origin = '',
}: {
  provider: Eip1193Provider
  safe: SafeState
  message: MessageItem['message']
  origin: string | undefined
}): Promise<void> => {
  const messageHash = generateSafeMessageHash(safe, message)

  try {
    const signer = await getAssertedChainSigner(provider)
    const signature = await tryOffChainMsgSigning(signer, safe, message)

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
      throw new Error(String(result.error))
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
}: {
  provider: Eip1193Provider
  safe: SafeState
  message: MessageItem['message']
}): Promise<void> => {
  const messageHash = generateSafeMessageHash(safe, message)

  try {
    const signer = await getAssertedChainSigner(provider)
    const signature = await tryOffChainMsgSigning(signer, safe, message)

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
      throw new Error(String(result.error))
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
