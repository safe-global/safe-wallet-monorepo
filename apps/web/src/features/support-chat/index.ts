import { createFeatureHandle } from '@/features/__core__'
import type { SupportChatContract } from './contract'

export const SupportChatFeature = createFeatureHandle<SupportChatContract>('support-chat')

export type { SupportChatContract } from './contract'

export { useSupportChat } from './hooks/useSupportChat'
export type { SupportChatConfig, UserIdentity } from './hooks/useSupportChat'
