import type WorkspaceSupportChat from './components/WorkspaceSupportChat'
import type SupportChatDrawer from './components/SupportChatDrawer'

export interface SupportChatContract {
  WorkspaceSupportChat: typeof WorkspaceSupportChat
  SupportChatDrawer: typeof SupportChatDrawer
}
