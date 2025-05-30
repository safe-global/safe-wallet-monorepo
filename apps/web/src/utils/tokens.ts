import { getWeb3ReadOnly } from '@/hooks/wallets/web3'
import { ERC20__factory, ERC721__factory } from '@safe-global/utils/types/contracts'
import { parseBytes32String } from '@ethersproject/strings'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { ERC721_IDENTIFIER } from '@safe-global/utils/utils/tokens'
import { type Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { multicall } from '../../../../packages/utils/src/utils/multicall'
import { type BytesLike } from 'ethers'

/**
 * Fetches ERC20 token symbol and decimals from on-chain.
 * @param address address of erc20 token
 */
export const getERC20TokenInfoOnChain = async (
  address: string | string[],
): Promise<Omit<Erc20Token, 'name' | 'logoUri'>[] | undefined> => {
  const web3 = getWeb3ReadOnly()
  if (!web3) return

  let tokenAddresses = Array.isArray(address) ? address : [address]

  const erc20_interface = ERC20__factory.createInterface()

  const calls = tokenAddresses.flatMap((address) => [
    {
      to: address,
      data: erc20_interface.encodeFunctionData('symbol'),
    },
    {
      to: address,
      data: erc20_interface.encodeFunctionData('decimals'),
    },
  ])

  const results = await multicall(web3, calls)

  const tokenInfos: Omit<Erc20Token, 'name' | 'logoUri'>[] = []
  for (let i = 0; i < results.length; i += 2) {
    const address = tokenAddresses[i / 2]
    if (!address) break
    let symbol: string
    try {
      symbol = erc20_interface.decodeFunctionResult('symbol', results[i].returnData)[0]
    } catch (error) {
      // Some older contracts use bytes32 instead of string
      symbol = parseBytes32String(
        error && typeof error === 'object' && 'value' in error ? (error.value as BytesLike) : '',
      )
    }
    const decimals = Number(erc20_interface.decodeFunctionResult('decimals', results[i + 1].returnData)[0])

    tokenInfos.push({
      address,
      symbol,
      decimals,
      type: TokenType.ERC20,
    })
  }

  return tokenInfos
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
