import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { SupportChatContract } from './contract'

export const SupportChatFeature = createFeatureHandle<SupportChatContract>('support-chat')
