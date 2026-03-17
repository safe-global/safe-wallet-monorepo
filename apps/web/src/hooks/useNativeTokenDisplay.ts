import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

type NativeTokenDisplay = {
  showNativeInBalances: boolean
  showGasFeeEstimation: boolean
  showWalletBalance: boolean
  showInsufficientFundsWarning: boolean
  showFeeInConfirmationText: boolean
  showUndeployedNativeValue: boolean
  showStablecoinFeeInfo: boolean
}

const SHOW_ALL: NativeTokenDisplay = {
  showNativeInBalances: true,
  showGasFeeEstimation: true,
  showWalletBalance: true,
  showInsufficientFundsWarning: true,
  showFeeInConfirmationText: true,
  showUndeployedNativeValue: true,
  showStablecoinFeeInfo: false,
}

const HIDE_NATIVE: NativeTokenDisplay = {
  showNativeInBalances: false,
  showGasFeeEstimation: false,
  showWalletBalance: false,
  showInsufficientFundsWarning: false,
  showFeeInConfirmationText: false,
  showUndeployedNativeValue: false,
  showStablecoinFeeInfo: true,
}

/**
 * Derives granular display capabilities from the HIDE_NATIVE_TOKEN chain feature.
 * Centralizes the decision logic so consumers only check named booleans.
 */
export const useNativeTokenDisplay = (): NativeTokenDisplay => {
  const hideNativeToken = useHasFeature(FEATURES.HIDE_NATIVE_TOKEN) === true

  return hideNativeToken ? HIDE_NATIVE : SHOW_ALL
}
