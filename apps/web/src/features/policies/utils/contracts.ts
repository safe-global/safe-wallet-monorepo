import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { ethers } from 'ethers'
import { POLICY_GUARD, POLICY_GUARD_ABI } from '../config/constants'

export const getPolicyGuardContract = () => {
  const sdk = getSafeSDK()
  if (!sdk) {
    throw new Error('Safe SDK not found.')
  }
  const provider = sdk.getSafeProvider()
  return new ethers.Contract(POLICY_GUARD, POLICY_GUARD_ABI, provider.getExternalProvider())
}
