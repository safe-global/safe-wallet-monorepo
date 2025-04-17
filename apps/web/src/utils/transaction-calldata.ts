import { id } from 'ethers'
import type { FunctionFragment } from 'ethers'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'

import { Multi_send__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { ERC20__factory } from '@safe-global/utils/types/contracts/factories/@openzeppelin/contracts/build/contracts/ERC20__factory'
import { ERC721__factory } from '@safe-global/utils/types/contracts/factories/@openzeppelin/contracts/build/contracts/ERC721__factory'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'

export const isCalldata = (data: string, fragment: FunctionFragment): boolean => {
  const signature = fragment.format()
  const signatureId = id(signature).slice(0, 10)
  return data.startsWith(signatureId)
}

// ERC-20
const erc20Interface = ERC20__factory.createInterface()
const transferFragment = erc20Interface.getFunction('transfer')
const isErc20TransferCalldata = (data: string): boolean => {
  return isCalldata(data, transferFragment)
}

// ERC-721
const erc721Interface = ERC721__factory.createInterface()
const transferFromFragment = erc721Interface.getFunction('transferFrom')
const isErc721TransferFromCalldata = (data: string): boolean => {
  return isCalldata(data, transferFromFragment)
}

const safeTransferFromFragment = erc721Interface.getFunction('safeTransferFrom(address,address,uint256)')
const isErc721SafeTransferFromCalldata = (data: string): boolean => {
  return isCalldata(data, safeTransferFromFragment)
}

const safeTransferFromWithBytesFragment = erc721Interface.getFunction('safeTransferFrom(address,address,uint256,bytes)')
const isErc721SafeTransferFromWithBytesCalldata = (data: string): boolean => {
  return isCalldata(data, safeTransferFromWithBytesFragment)
}

// Safe
const safeInterface = Safe__factory.createInterface()

const addOwnerWithThresholdFragment = safeInterface.getFunction('addOwnerWithThreshold')
export function isAddOwnerWithThresholdCalldata(data: string): boolean {
  return isCalldata(data, addOwnerWithThresholdFragment)
}

const removeOwnerFragment = safeInterface.getFunction('removeOwner')
export function isRemoveOwnerCalldata(data: string): boolean {
  return isCalldata(data, removeOwnerFragment)
}

const swapOwnerFagment = safeInterface.getFunction('swapOwner')
export function isSwapOwnerCalldata(data: string): boolean {
  return isCalldata(data, swapOwnerFagment)
}

const changeThresholdFragment = safeInterface.getFunction('changeThreshold')
export function isChangeThresholdCalldata(data: string): boolean {
  return isCalldata(data, changeThresholdFragment)
}

// MultiSend
const multiSendInterface = Multi_send__factory.createInterface()
const multiSendFragment = multiSendInterface.getFunction('multiSend')
export const isMultiSendCalldata = (data: string): boolean => {
  return isCalldata(data, multiSendFragment)
}

export const getTransactionRecipients = ({ data, to }: BaseTransaction): Array<string> => {
  // ERC-20
  if (isErc20TransferCalldata(data)) {
    const [to] = erc20Interface.decodeFunctionData(transferFragment, data)
    return [to]
  }

  // ERC-721
  if (isErc721TransferFromCalldata(data)) {
    const [, to] = erc721Interface.decodeFunctionData(transferFromFragment, data)
    return [to]
  }

  if (isErc721SafeTransferFromCalldata(data)) {
    const [, to] = erc721Interface.decodeFunctionData(safeTransferFromFragment, data)
    return [to]
  }

  if (isErc721SafeTransferFromWithBytesCalldata(data)) {
    const [, to] = erc721Interface.decodeFunctionData(safeTransferFromWithBytesFragment, data)
    return [to]
  }

  // multiSend
  if (isMultiSendCalldata(data)) {
    return decodeMultiSendData(data).flatMap(getTransactionRecipients)
  }

  // Other (e.g. native transfer)
  return [to]
}
