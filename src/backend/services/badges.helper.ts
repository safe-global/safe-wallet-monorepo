import type { SupabaseClient } from '@supabase/supabase-js'
import { Alchemy, AssetTransfersCategory, Network } from 'alchemy-sdk'
import { ethers } from 'ethers'
import { CovalentClient } from '@covalenthq/client-sdk'

export class BadgesHelper {
  supabase: SupabaseClient
  covalent = new CovalentClient(process.env.COVALENT_API_KEY!)
  constructor(_supabase: SupabaseClient) {
    this.supabase = _supabase
  }
  async getOptimisimTransactions(eoas: string[], block: string): Promise<number> {
    const settings = {
      apiKey: process.env.ALCHEMY_PRIVATE_KEY!,
      network: Network.OPT_MAINNET,
    }

    const alchemy = new Alchemy(settings)
    const transactions = await eoas.reduce(async (accPromise, eoa) => {
      const acc = await accPromise
      const res = await alchemy.core.getAssetTransfers({
        fromBlock: block,
        toBlock: 'latest',
        toAddress: eoa,
        excludeZeroValue: true,
        category: [
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC1155,
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC721,
        ],
      })

      return acc + res.transfers.length
    }, Promise.resolve(0))

    return transactions
  }

  async getBaseTransactions(eoas: string[], block: string) {
    const settings = {
      apiKey: process.env.ALCHEMY_PRIVATE_KEY!,
      network: Network.BASE_MAINNET,
    }
    const alchemy = new Alchemy(settings)
    const transactions = await eoas.reduce(async (accPromise, eoa) => {
      const acc = await accPromise
      const res = await alchemy.core.getAssetTransfers({
        fromBlock: block,
        toBlock: 'latest',
        toAddress: eoa,
        excludeZeroValue: true,
        category: [
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC1155,
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC721,
        ],
      })

      return acc + res.transfers.length
    }, Promise.resolve(0))

    return transactions
  }

  async getModeTransactions(eoas: string[], block: string) {
    const transactions = eoas.reduce(async (accPromise, eoa) => {
      const resp = await this.covalent.TransactionService.getAllTransactionsForAddressByPage('mode-testnet', eoa)
      return (await accPromise) + resp.data.items.length
    }, Promise.resolve(0))
    return transactions
  }

  async isCitizen(eoas: string[]) {
    for (const eoa of eoas) {
      const { data, error } = await this.supabase.from('Citizen').select('*').eq('address', eoa).single()

      if (data.length > 0) {
        if (!data[0].claimed) return false
        return true
      }
    }
    return false
  }

  async hasNouns(eoas: string[]) {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!)
    const contract = new ethers.Contract(
      process.env.NOUNS_ADDRESS!,
      ['function balanceOf(address owner) public view returns (uint256)'],
      provider,
    )
    let countNouns = 0
    for (const eoa of eoas) {
      const balance = await contract.balanceOf(eoa)
      if (balance.gt(0)) countNouns++
    }
    return countNouns
  }
}

export interface IBadgesHelper {
  getOptimisimTransactions(eoas: string[], block: string): Promise<number>
  getBaseTransactions(eoas: string[], block: string): Promise<number>
  getModeTransactions(eoas: string[], block: string): Promise<number>
  isCitizen(eoas: string[]): Promise<boolean>
  hasNouns(eoas: string[]): Promise<number>
}
