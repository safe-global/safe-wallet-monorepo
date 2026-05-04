import { create, get } from 'react-native-passkeys'

const RP_ID = 'app.safe.global'
const RP_NAME = 'Safe Smart Account'
const USER_DISPLAY_NAME = 'Safe account'
const USER_NAME = 'safe-account'
const USER_ID = 'safe-passkey-user'
const CHALLENGE_PLACEHOLDER = 'safe-passkey-challenge'

export async function createPasskey(): Promise<PublicKeyCredential | null> {
  const challenge = bufferToBase64URLString(utf8StringToBuffer(CHALLENGE_PLACEHOLDER))
  const userId = bufferToBase64URLString(utf8StringToBuffer(USER_ID))

  const credentialRequestJson = {
    pubKeyCredParams: [{ alg: -7, type: 'public-key' as const }],
    challenge,
    rp: {
      id: RP_ID,
      name: RP_NAME,
    },
    user: { displayName: USER_DISPLAY_NAME, id: userId, name: USER_NAME },
    timeout: 60_000,
    attestation: 'none' as const,
    authenticatorSelection: {
      requireResidentKey: true,
    },
  }

  const passkey = await create(credentialRequestJson as Parameters<typeof create>[0])

  return passkey as PublicKeyCredential | null
}

export async function authenticatePasskey(options?: CredentialRequestOptions): Promise<Credential> {
  const challenge = bufferSourceToBase64Url(options?.publicKey?.challenge)
  const allowCredentials = options?.publicKey?.allowCredentials?.map((cred) => ({
    type: cred.type,
    id: getBinaryString(cred.id),
  }))

  const credential = await get({
    rpId: RP_ID,
    challenge,
    userVerification: options?.publicKey?.userVerification,
    allowCredentials,
  })

  if (!credential) {
    throw new Error('Passkey authentication failed: no credential returned')
  }

  if (credential.response) {
    credential.response.authenticatorData = base64ToArrayBuffer(credential.response.authenticatorData)
    credential.response.clientDataJSON = base64ToArrayBuffer(credential.response.clientDataJSON)
    credential.response.signature = base64ToArrayBuffer(credential.response.signature)
  }

  return credential as Credential
}

function bufferToBase64URLString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode)
  }
  const base64String = btoa(str)
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function utf8StringToBuffer(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer as ArrayBuffer
}

function getBinaryString(buffer: BufferSource): string {
  const byteArray = new Uint8Array(buffer as ArrayBuffer)
  return Array.from(byteArray)
    .map((byte) => String.fromCharCode(byte))
    .join('')
}

function bufferSourceToBase64Url(bufferSource: BufferSource | undefined): string {
  if (!bufferSource) {
    return ''
  }
  const binaryString = getBinaryString(bufferSource)
  const base64String = btoa(binaryString)
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let normalized = base64.replace(/-/g, '+').replace(/_/g, '/')
  while (normalized.length % 4 !== 0) {
    normalized += '='
  }
  const binaryString = atob(normalized)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
