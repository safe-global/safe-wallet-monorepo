import { Contract } from 'ethers'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'
import { readChain } from './local-provider'

const erc721 = ['function ownerOf(uint256 tokenId) view returns (address)']

/** The owner of the ERC-721 token `tokenId` of `contract` on the local fork. */
export function ownerOf(
  env: JourneyEnvironment,
  { contract, tokenId }: { contract: string; tokenId: string },
): Promise<string> {
  return readChain(env, async (provider) => {
    const owner: unknown = await new Contract(contract, erc721, provider).getFunction('ownerOf')(tokenId)
    return String(owner)
  })
}
