import type { UserSession } from '@safe-global/store/gateway/AUTO_GENERATED/auth'

export function getSupportIdentityKey(session?: UserSession): string | undefined {
  if (!session?.id) return undefined
  if (session.authMethod === 'oidc') return `oidc:${session.id}`
  if (session.authMethod === 'siwe' && session.signerAddress) {
    return `siwe:${session.id}:${session.signerAddress.toLowerCase()}`
  }
  return undefined
}
