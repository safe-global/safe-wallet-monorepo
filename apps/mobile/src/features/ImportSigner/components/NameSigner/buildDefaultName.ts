export function buildDefaultName(walletName: string | undefined, address: string): string {
  const base = walletName || 'Signer'
  const name = `${base} - ${address.slice(-4)}`

  return name.length > 20 ? name.slice(0, 19) + '\u2026' : name
}
