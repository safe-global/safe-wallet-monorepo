import { getWeb3ReadOnly } from '@/hooks/wallets/web3'
import { ERC20__factory, ERC721__factory } from '@safe-global/utils/types/contracts'
import { parseBytes32String } from '@ethersproject/strings'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { ERC721_IDENTIFIER } from '@safe-global/utils/utils/tokens'
import { type Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

/**
 * Fetches ERC20 token symbol and decimals from on-chain.
 * @param address address of erc20 token
 */
export const getERC20TokenInfoOnChain = async (
  address: string,
): Promise<Omit<Erc20Token, 'name' | 'logoUri'> | undefined> => {
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
