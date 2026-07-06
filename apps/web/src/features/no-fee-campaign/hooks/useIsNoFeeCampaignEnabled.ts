import { useIsNoFeeCampaign } from '@/hooks/useChains'

export function useIsNoFeeCampaignEnabled() {
  return useIsNoFeeCampaign()
}
