import { useIsUnlimitedRelay } from '@/hooks/useChains'

export const useIsGtfSlotVisible = (): boolean => !!useIsUnlimitedRelay()
