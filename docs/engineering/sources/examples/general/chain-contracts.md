# Chain Contracts

Use these examples when changing Safe version parsing, deployment lookup,
contract address resolution, or multichain compatibility.

## normalize-versions-and-origin

Prefer:

```ts
const safeVersion = getSafeVersion(version)
const txOrigin = getTxOrigin({ name: '', url: window.location.origin })
```

Avoid:

```ts
const safeVersion = version ?? '1.3.0'
const txOrigin = JSON.stringify({ name: '', url: window.location.origin })
```

Why:

Safe versions can include metadata such as `+L2`, and transaction origins have
length limits. Use the existing normalization helpers before lookup or encoding.

## deployment-data-not-chain-flags

Prefer:

```ts
const deployment = getDeploymentTypeForMasterCopy({
  chainId,
  implementation,
  version: getSafeVersion(version),
})

return resolveChainAgnosticContractAddresses({
  chainId,
  deploymentType: deployment.type,
})
```

Avoid:

```ts
return resolveChainAgnosticContractAddresses({
  isZk: chain.features.includes('zk'),
})
```

Why:

Chain-level flags are too coarse. A Safe's master copy can disagree with the
chain's broad `zk` or `l2` label, and contract addresses must match the actual
registered deployment for that chain and Safe version.
