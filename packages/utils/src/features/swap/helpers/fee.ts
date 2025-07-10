import { v1_4_0, v1_3_0, LatestAppDataDocVersion } from '@cowprotocol/app-data'
import type { OrderTransactionInfo as SwapOrder } from '@safe-global/store/gateway/types'

type VolumeFee = {
  volumeBps: v1_4_0.VolumeBasisPointBPS
  recipient: v1_4_0.PartnerAccount
}

type SurplusFee = {
  surplusBps: v1_4_0.SurplusBasisPointBPS
  maxVolumeBps: v1_4_0.MaxVolumeBasisPointBPS
  recipient: v1_4_0.PartnerAccount
}

type PriceImprovementFee = {
  priceImprovementBps: v1_4_0.PriceImprovementBasisPointBPS
  maxVolumeBps: v1_4_0.MaxVolumeBasisPointBPS
  recipient: v1_4_0.PartnerAccount
}

// Add proper type definitions that account for undefined
type LegacyPartnerFee = v1_3_0.PartnerFee | undefined
type ModernPartnerFee = v1_4_0.PartnerFee | v1_4_0.PartnerFee[] | undefined

function isVolumeFee(fee: v1_4_0.PartnerFee): fee is VolumeFee {
  return typeof (fee as VolumeFee).volumeBps === 'number'
}

function isSurplusFee(fee: v1_4_0.PartnerFee): fee is SurplusFee {
  return typeof (fee as SurplusFee).surplusBps === 'number'
}

function isPriceImprovementFee(fee: v1_4_0.PartnerFee): fee is PriceImprovementFee {
  return typeof (fee as PriceImprovementFee).priceImprovementBps === 'number'
}

/**
 * Right now it doesn't look like we need the surplus and price improvement fees.
 * and that's why we don't use this function yet.
 */
function resolveNewPartnerFeeBps(fee: v1_4_0.PartnerFee): number | null {
  if (isVolumeFee(fee)) {
    return fee.volumeBps
  }
  if (isSurplusFee(fee)) {
    return fee.surplusBps
  }
  if (isPriceImprovementFee(fee)) {
    return fee.priceImprovementBps
  }
  return null
}

export const getOrderFeeBps = (order: Pick<SwapOrder, 'fullAppData'>): number => {
  const fullAppData = order.fullAppData as unknown as LatestAppDataDocVersion

  if (!fullAppData?.metadata) {
    return 0
  }

  // Handle legacy partner fee format (v1.3.0) with proper null checks
  const oldPartnerFee = fullAppData.metadata.partnerFee as unknown as LegacyPartnerFee

  // Check if it's the legacy format and has bps property
  if (
    oldPartnerFee &&
    typeof oldPartnerFee === 'object' &&
    'bps' in oldPartnerFee &&
    typeof oldPartnerFee.bps === 'number'
  ) {
    return Number(oldPartnerFee.bps)
  }

  // Handle modern partner fee format (v1.4.0) with proper null checks
  const newPartnerFee = fullAppData.metadata.partnerFee as unknown as ModernPartnerFee

  if (!newPartnerFee) {
    return 0
  }

  if (Array.isArray(newPartnerFee)) {
    return newPartnerFee.reduce((acc, fee) => {
      if (isVolumeFee(fee)) {
        return acc + Number(fee.volumeBps)
      }
      return acc
    }, 0)
  }

  return isVolumeFee(newPartnerFee) ? Number(newPartnerFee.volumeBps) : 0
}
