import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { securityServices, type SecurityServices } from '../services/securityServices'

/** The Security Hub services, or undefined while the chain has the Security Hub flag off. */
export const useSecurityServices = (): SecurityServices | undefined =>
  useHasFeature(FEATURES.SECURITY_HUB) === true ? securityServices : undefined
