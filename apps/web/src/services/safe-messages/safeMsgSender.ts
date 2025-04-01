import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { proposeSafeMessage, confirmSafeMessage } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
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

export const dispatchSafeMsgProposal = async ({
  provider,
  safe,
  message,
  origin = '',
}: {
  provider: Eip1193Provider
  safe: SafeInfo
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

    await proposeSafeMessage(safe.chainId, safe.address.value, {
      message: normalizedMessage,
      signature,
      origin,
    })
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
  safe: SafeInfo
  message: MessageItem['message']
}): Promise<void> => {
  const messageHash = generateSafeMessageHash(safe, message)

  try {
    const signer = await getAssertedChainSigner(provider)
    const signature = await tryOffChainMsgSigning(signer, safe, message)

    await confirmSafeMessage(safe.chainId, messageHash, {
      signature,
    })
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
