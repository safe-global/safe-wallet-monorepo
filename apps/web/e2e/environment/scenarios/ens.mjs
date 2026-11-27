import { Contract, getAddress, isAddress, namehash, zeroPadValue } from 'ethers'
import { localProvider } from './provider.mjs'
import { send } from './chain.mjs'

const registryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const nameWrapperAddress = '0x0635513f179D50A207757E05759CbD106d7dFcE8'
const reverseRegistrarAddress = '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6'
const universalResolverAddress = '0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe'
// The Universal Resolver implementation before Sepolia's ENS upgrade: it reads the registry these names are set in
const registryUniversalResolver = getAddress('0x3c85752a5d47dd09d677c645ff2a938b38fbfeba')
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

const sendAs = (provider, from, contract, method, args) =>
  send(provider, from, { to: contract.target, data: contract.interface.encodeFunctionData(method, args) })

async function resolveThroughRegistry(provider) {
  if ((await provider.getCode(registryUniversalResolver)) === '0x') {
    throw new Error(`No Universal Resolver implementation at ${registryUniversalResolver} on the fork`)
  }
  await provider.send('anvil_setStorageAt', [
    universalResolverAddress,
    IMPLEMENTATION_SLOT,
    zeroPadValue(registryUniversalResolver, 32),
  ])
}

// Points the name at the address and the address back at the name, as the wallet checks both directions.
export async function setEnsName(env, name, address) {
  if (!name?.endsWith('.eth') || !isAddress(address)) throw new Error('ENS setup requires a .eth name and an address')
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    await resolveThroughRegistry(provider)
    const node = namehash(name)
    const registry = new Contract(
      registryAddress,
      ['function owner(bytes32) view returns (address)', 'function resolver(bytes32) view returns (address)'],
      provider,
    )
    const resolver = new Contract(
      await registry.resolver(node),
      ['function addr(bytes32) view returns (address)', 'function setAddr(bytes32,address)'],
      provider,
    )
    if ((await resolver.addr(node)) !== getAddress(address)) {
      let owner = await registry.owner(node)
      // The resolver authorises the owner of a wrapped name, not the NameWrapper itself.
      if (owner === nameWrapperAddress) {
        owner = await new Contract(owner, ['function ownerOf(uint256) view returns (address)'], provider).ownerOf(node)
      }
      await sendAs(provider, owner, resolver, 'setAddr', [node, address])
    }
    const reverseRegistrar = new Contract(reverseRegistrarAddress, ['function setName(string)'], provider)
    await sendAs(provider, getAddress(address), reverseRegistrar, 'setName', [name])
  } finally {
    provider.destroy()
  }
}
