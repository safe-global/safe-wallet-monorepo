import { readFile } from 'node:fs/promises'
import { Contract, getAddress, isAddress, namehash, zeroPadValue } from 'ethers'
import { localProvider } from './provider.mjs'
import { send } from './chain.mjs'

const registryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const nameWrapperAddress = '0x0635513f179D50A207757E05759CbD106d7dFcE8'
const reverseRegistrarAddress = '0xA0a1AbcDAe1a2a4A2EF8e9113Ff0e02DD81DC0C6'
const mockedResolver = '0x8fade66b79cc9f707ab26799354482eb93a5b7dd'

const sendAs = (provider, from, contract, method, args) =>
  send(provider, from, { to: contract.target, data: contract.interface.encodeFunctionData(method, args) })

// Points the name at the address and the address back at the name, as the wallet checks both directions.
export async function setEnsName(env, name, address) {
  if (!name?.endsWith('.eth') || !isAddress(address)) throw new Error('ENS setup requires a .eth name and an address')
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
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

// Existing specs mock the ENS RPC responses; the mocked resolver answer becomes the scenario's address.
export async function ensFixtureFiles(address) {
  if (!isAddress(address)) throw new Error('The ENS fixture requires an address')
  const name = 'ens_e2etestsafe.json'
  const fixture = JSON.parse(await readFile(new URL(`../../../cypress/fixtures/${name}`, import.meta.url), 'utf8'))
  if (!fixture[mockedResolver]) throw new Error(`${name} no longer mocks the resolver ${mockedResolver}`)
  fixture[mockedResolver] = zeroPadValue(address.toLowerCase(), 32)
  return { [name]: fixture }
}
