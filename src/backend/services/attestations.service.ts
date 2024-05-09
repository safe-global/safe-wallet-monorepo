import { EAS__factory } from '@ethereum-attestation-service/eas-contracts/dist/typechain-types/factories/contracts/EAS__factory'
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk'
import { ethers } from 'ethers'
import type { Badge } from './badges.service'
import { createClient } from './supabase.service'

class AttestationsService {
  private easContractAddress = process.env.EAS_CONTRACT_ADDRESS!
  private schemaString = 'uint256 DPGPoints'
  private provider = new ethers.JsonRpcProvider(process.env.RPC_URL!)
  private wallet = new ethers.Wallet(process.env.ATTESTATOR_SIGNER_PRIVATE_KEY!, this.provider)
  private eas = EAS__factory.connect(this.easContractAddress, this.wallet)
  private schemaEncoder = new SchemaEncoder(this.schemaString)

  private supabase = createClient()
  public async attest(account: string, totalPoints: number, badges: Badge[]) {
    const schemaUID = process.env.SCHEMA_UID!
    const encodedData = this.schemaEncoder.encodeData([{ name: 'DPGPoints', value: totalPoints, type: 'uint256' }])

    for (const badge of badges) {
      const { data: badgeData, error: badgeError } = await this.supabase
        .from('Badges')
        .select('*')
        .eq('id', badge.id)
        .single()

      if (badgeError || !badgeData) {
        console.error(`Error fetching badge data for badge ID ${badge.id}:`, badgeError)
        throw new Error(`Badge data fetch error for badge ID ${badge.id}`)
      }

      let updateResult
      if (badgeData.dataOrigin === 'onChain') {
        const blockNumber = await this.provider.getBlockNumber()
        updateResult = await this.upsertAccountBadge(badge, account, null, blockNumber)
      } else {
        const timestamp = new Date()
        updateResult = await this.upsertAccountBadge(badge, account, timestamp, null)
      }

      if (updateResult.error) {
        console.error(`Error updating AccountBadges for badge ID ${badge.id}:`, updateResult.error)
        throw new Error(`AccountBadges update error for badge ID ${badge.id}`)
      }
    }

    try {
      const tx = await this.eas.attest({
        schema: schemaUID,
        data: {
          recipient: account,
          expirationTime: BigInt(0),
          refUID: ethers.ZeroHash,
          revocable: false,
          data: encodedData,
          value: BigInt(0),
        },
      })

      const receipt = await tx.wait()
      console.log(`Attestation successful. Transaction hash: ${receipt?.hash}`)
      return receipt
    } catch (error: any) {
      console.error('Error attesting', error)
      throw new Error(error)
    }
  }

  private async upsertAccountBadge(badge: Badge, account: string, timestamp: Date | null, blockNumber: number | null) {
    const { data, error } = await this.supabase.from('AccountBadges').upsert({
      badgeId: badge.id,
      account,
      title: badge.name,
      points: badge.points,
      lastClaim: timestamp ? timestamp.toISOString() : null,
      lastClaimBlock: blockNumber,
      isDeleted: false,
    })

    return { data, error }
  }
}

export const attestationsService = new AttestationsService()
