export type Signer = (message: Buffer) => Buffer

export function base64url(data: Buffer | string): string {
  return Buffer.from(data).toString('base64url')
}

/** Encodes a compact JWT: base64url header and claims, signed together by `signer`. */
export function signJwt(header: Record<string, unknown>, claims: Record<string, unknown>, signer: Signer): string {
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  return `${signingInput}.${base64url(signer(Buffer.from(signingInput)))}`
}
