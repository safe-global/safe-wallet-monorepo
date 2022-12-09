import { proposeSafeMessage, confirmSafeMessage } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeInfo, SafeMessage } from '@safe-global/safe-gateway-typescript-sdk'
import type { RequestId } from '@gnosis.pm/safe-apps-sdk'
import type { TypedDataDomain } from 'ethers'
import type { JsonRpcSigner } from '@ethersproject/providers'

import { safeMsgDispatch, SafeMsgEvent } from './safeMsgEvents'
import { generateSafeMessageHash, generateSafeMessageTypedData } from '@/utils/safe-messages'

export const dispatchSafeMsgProposal = async ({
  signer,
  safe,
  message,
  requestId,
  safeAppId,
}: {
  signer: JsonRpcSigner
  safe: SafeInfo
  message: SafeMessage['message']
  requestId: RequestId
  safeAppId?: number
}): Promise<void> => {
  const messageHash = generateSafeMessageHash(safe, message)

  try {
    const typedData = generateSafeMessageTypedData(safe, message)
    const signature = await signer._signTypedData(
      typedData.domain as TypedDataDomain,
      typedData.types,
      typedData.message,
    )

    await proposeSafeMessage(safe.chainId, safe.address.value, {
      message,
      signature,
      safeAppId,
    })
  } catch (error) {
    safeMsgDispatch(SafeMsgEvent.PROPOSE_FAILED, {
      messageHash,
      error: error as Error,
    })

    throw error
  }

  safeMsgDispatch(SafeMsgEvent.PROPOSE, {
    messageHash,
    requestId,
  })
}

export const dispatchSafeMsgConfirmation = async ({
  signer,
  safe,
  message,
  requestId,
}: {
  signer: JsonRpcSigner
  safe: SafeInfo
  message: SafeMessage['message']
  requestId?: RequestId
}): Promise<void> => {
  const messageHash = generateSafeMessageHash(safe, message)

  try {
    const typedData = generateSafeMessageTypedData(safe, message)
    const signature = await signer._signTypedData(
      typedData.domain as TypedDataDomain,
      typedData.types,
      typedData.message,
    )

    await confirmSafeMessage(safe.chainId, messageHash, {
      signature,
    })
  } catch (error) {
    safeMsgDispatch(SafeMsgEvent.CONFIRM_PROPOSE_FAILED, {
      messageHash,
      error: error as Error,
    })

    throw error
  }

  safeMsgDispatch(SafeMsgEvent.CONFIRM_PROPOSE, {
    messageHash,
    requestId,
  })
}
