const getSignableMessage = (address: string, chainId: bigint, nonce: string) => {
  const message = {
    domain: window.location.host,
    address,
    statement:
      'By signing, you are agreeing to store this data on the Safe Cloud. This does not initiate a transaction or cost any fees.',
    uri: window.location.origin,
    version: '1',
    chainId: Number(chainId),
    nonce,
    issuedAt: new Date(),
  }
  const signableMessage = `${message.domain} wants you to sign in with your Ethereum account:
${message.address}

${message.statement}

URI: ${message.uri}
Version: ${message.version}
Chain ID: ${message.chainId}
Nonce: ${message.nonce}
Issued At: ${message.issuedAt.toISOString()}`

  return signableMessage
}

export { getSignableMessage }
