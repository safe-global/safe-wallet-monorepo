import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import NextLink from 'next/link'
import SupportChatDrawer from './SupportChatDrawer'
import { useSupportSession } from '../hooks/useSupportSession'

export type AuthenticatedSupportChatProps = {
  gatewayUrl: string
  chatUrl: string
  identityKey?: string
  open: boolean
  onClose: () => void
}

export default function AuthenticatedSupportChat({
  gatewayUrl,
  chatUrl,
  identityKey,
  open,
  onClose,
}: AuthenticatedSupportChatProps) {
  const { session, error, retry } = useSupportSession(gatewayUrl, open, identityKey)
  if (!open) return null
  if (!identityKey || !session) {
    return (
      <div className="fixed bottom-6 right-6 flex w-[340px] max-w-[calc(100vw-48px)] flex-col gap-4 rounded-lg bg-card p-6 shadow-lg">
        <Typography variant="h4">Help and support</Typography>
        {!identityKey ? (
          <>
            <Typography>Sign in to your Workspace to access support.</Typography>
            <Button render={<NextLink href="/welcome/spaces" />}>Sign in</Button>
          </>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Spinner aria-label="Loading support" />
        )}
        {identityKey && error && <Button onClick={retry}>Try again</Button>}
        <a href="https://help.safe.global" target="_blank" rel="noreferrer" className="text-primary underline">
          Documentation
        </a>
        <Button onClick={onClose}>Close support</Button>
      </div>
    )
  }
  return (
    <SupportChatDrawer
      key={`${identityKey}:${session.email}:${session.appId}`}
      open={open}
      onClose={onClose}
      onRetry={retry}
      config={{ appId: session.appId, chatUrl, aliasDomain: '', allowedParents: [] }}
      user={{
        email: session.email,
        name: '',
        jwt: session.jwt,
        supportEligible: session.supportEligible,
        identityType: session.identityType,
      }}
    />
  )
}
