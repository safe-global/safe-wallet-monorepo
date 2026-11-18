import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { SupportChatContract } from './contract'

export const SupportChatFeature = createFeatureHandle<SupportChatContract>('support-chat')

export type { SupportChatContract } from './contract'

export type { SupportChatConfig, UserIdentity } from './hooks/useSupportChat'
