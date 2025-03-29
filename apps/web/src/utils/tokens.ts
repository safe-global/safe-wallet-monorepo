import { getWeb3ReadOnly } from '@/hooks/wallets/web3'
import { ERC20__factory, ERC721__factory } from '@safe-global/utils/types/contracts'
import { parseBytes32String } from '@ethersproject/strings'
import { type TokenInfo, TokenType } from '@safe-global/safe-gateway-typescript-sdk'

export const UNLIMITED_APPROVAL_AMOUNT = 2n ** 256n - 1n
export const UNLIMITED_PERMIT2_AMOUNT = 2n ** 160n - 1n

// As per https://eips.ethereum.org/EIPS/eip-721#specification
export const ERC721_IDENTIFIER = '0x80ac58cd'

/**
 * Fetches ERC20 token symbol and decimals from on-chain.
 * @param address address of erc20 token
 */
export const getERC20TokenInfoOnChain = async (
  address: string,
): Promise<Omit<TokenInfo, 'name' | 'logoUri'> | undefined> => {
  const web3 = getWeb3ReadOnly()
  if (!web3) return

  const erc20 = ERC20__factory.connect(address, web3)

  const symbol = await erc20
    .symbol()
    .then((symbol) => symbol)
    .catch((error) => parseBytes32String(error.value)) // Some older contracts use bytes32 instead of string
    .finally(() => '')

  const decimals = await erc20.decimals()

  return {
    address,
    symbol,
    decimals: Number(decimals),
    type: TokenType.ERC20,
  }
}

export const getErc721Symbol = async (address: string) => {
  const web3 = getWeb3ReadOnly()
  if (!web3) return ''

  const erc721 = ERC721__factory.connect(address, web3)

  try {
    return await erc721.symbol()
  } catch (e) {
    return ''
  }
}

export const isErc721Token = async (address: string) => {
  const web3 = getWeb3ReadOnly()
  if (!web3) return false

  const erc721 = ERC721__factory.connect(address, web3)

  try {
    return await erc721.supportsInterface(ERC721_IDENTIFIER)
  } catch (e) {
    return false
  }
}
