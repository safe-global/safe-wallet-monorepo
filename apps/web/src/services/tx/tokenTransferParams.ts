import type { MetaTransactionData } from '@safe-global/types-kit'
import { ConfirmationViewTypes, type BaselineConfirmationView } from '@safe-global/safe-gateway-typescript-sdk'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import { Interface } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'

// CryptoKitties Contract Addresses by network
// This is an exception made for a popular NFT that's not ERC721 standard-compatible,
// so we can allow the user to transfer the assets by using `transfer` instead of
// the standard `safeTransferFrom` method.
const CryptoKittiesContract = '0x06012c8cf97bead5deae237070f9587f8e7a266d'

const encodeERC20TransferData = (to: string, value: string): string => {
  const erc20Abi = ['function transfer(address to, uint256 value)']
  const contractInterface = new Interface(erc20Abi)
  return contractInterface.encodeFunctionData('transfer', [to, value])
}

const encodeERC721TransferData = (from: string, to: string, tokenId: string): string => {
  const erc721Abi = ['function safeTransferFrom(address from, address to, uint256 tokenId)']
  const contractInterface = new Interface(erc721Abi)
  return contractInterface.encodeFunctionData('safeTransferFrom', [from, to, tokenId])
}

export const createTokenTransferParams = (
  recipient: string,
  amount: string,
  decimals: number | null | undefined,
  tokenAddress: string,
): MetaTransactionData => {
  const isNativeToken = parseInt(tokenAddress, 16) === 0
  const value = safeParseUnits(amount, decimals)?.toString() || '0'

  return isNativeToken
    ? {
        to: recipient,
        value,
        data: '0x',
      }
    : {
        to: tokenAddress,
        value: '0',
        data: encodeERC20TransferData(recipient, value),
      }
}

export const createNftTransferParams = (
  from: string,
  to: string,
  tokenId: string,
  tokenAddress: string,
): MetaTransactionData => {
  let data = encodeERC721TransferData(from, to, tokenId)

  // An exception made for CryptoKitties, which is not ERC721 standard-compatible
  if (sameAddress(tokenAddress, CryptoKittiesContract)) {
    data = encodeERC20TransferData(to, tokenId)
  }

  return {
    to: tokenAddress,
    value: '0',
    data,
  }
}

export const getNativeTransferData = ({
  to,
  value,
}: Pick<MetaTransactionData, 'to' | 'value'>): BaselineConfirmationView => {
  return {
    type: ConfirmationViewTypes.GENERIC,
    method: '',
    parameters: [
      {
        name: 'to',
        type: 'address',
        value: to,
      },
      {
        name: 'value',
        type: 'uint256',
        value,
      },
    ],
  }
}
