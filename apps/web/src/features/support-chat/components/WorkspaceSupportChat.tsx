import { getSupportIdentityKey } from '../utils/supportIdentity'
import { useAuthGetMeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import AuthenticatedSupportChat from './AuthenticatedSupportChat'

export default function WorkspaceSupportChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const signedIn = useAppSelector(isAuthenticated)
  const { currentData: session, isError } = useAuthGetMeV1Query(undefined, {
    skip: !signedIn || !open,
    refetchOnMountOrArgChange: true,
  })
  const identityKey = signedIn && !isError ? getSupportIdentityKey(session) : undefined

  return (
    <AuthenticatedSupportChat
      gatewayUrl={GATEWAY_URL}
      chatUrl={SUPPORT_CHAT_URL}
      identityKey={identityKey}
      open={open}
      onClose={onClose}
    />
  )
}
