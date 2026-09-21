import { AbiCoder, getCreate2Address, keccak256, solidityPacked, concat, type Provider } from 'ethers'
import { predictSafeAddress } from '../utils'

// Chain-verified fixture: zkSync Era mainnet Safe created via the EraVM (zksync-flavour)
// 1.3.0 proxy factory in tx 0xa98489a0771e919bc0263642361eb5ab3358356ab324ed8103519291a4620547.
// Creation data from https://safe-transaction-zksync.safe.global/api/v1/safes/<address>/creation/
const ERA_VM_FIXTURE = {
  factory: '0xDAec33641865E4651fB43181C6DB6f7232Ee91c2',
  singleton: '0x1727c2c531cf966f902E5927b98490fDFb3b2b70',
  saltNonce: '0',
  initializer:
    '0xb63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000002f870a80647bbc554f3a0ebd093f11b4d2a7492a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005afe7a11e700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000004cf25c77de50babab44c6bcc76d88624ddb3ebbe0000000000000000000000000000000000000000000000000000000000000000',
  deployedAddress: '0xb0957F0ee647008D90bbc3e224B21298a8ef2adE',
}

// Chain-verified fixture: zkSync Era mainnet Safe created via the EraVM (zksync-flavour)
// 1.4.1 proxy factory by Across Protocol; recorded in their Foundry broadcast
// (github.com/across-protocol/contracts, broadcast/DeploySafe.s.sol/324/run-latest.json).
// Verifies the 1.4.1 EraVM proxy bytecode hash against a real on-chain deployment.
const ERA_VM_141_FIXTURE = {
  factory: '0xc329D02fd8CB2fc13aa919005aF46320794a8629',
  singleton: '0x610fcA2e0279Fa1F8C00c8c2F71dF522AD469380',
  saltNonce: '0',
  initializer:
    '0xb63e800d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000009301e98dd367135f21bdf66f342a249c9d5f90690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000837219d7a9c666f5542c4559bf17d7b804e5c5fe0000000000000000000000002b9cac7a18c70cbb6f6639571785b70a41b8ae03000000000000000000000000996267d7d1b7f5046543fede2c2db473ed4f65e9000000000000000000000000e767c1fcbec2f9b3a229b82bbc8aa21bac09bdb40000000000000000000000004851ec4e5a5b392328b825ecd94af1ca93fd609e0000000000000000000000000000000000000000000000000000000000000000',
  deployedAddress: '0x396eC04b105587E9DC1a13D27F28D99262f74910',
}

// Canonical (EVM) 1.4.1 proxy factory — same deterministic address on every chain.
const CANONICAL_FACTORY_141 = '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67'
const CANONICAL_SINGLETON_141 = '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762'

// Any EVM bytecode stands in for the factory's proxyCreationCode() response.
const MOCK_PROXY_CREATION_CODE = '0x608060405234801561001057600080fd5b50'

describe('predictSafeAddress', () => {
  it('derives the zkSync native CREATE2 address for an EraVM factory (chain-verified fixture)', async () => {
    // The EraVM path must not touch the provider at all — an empty object would throw on any access.
    const provider = {} as Provider

    const address = await predictSafeAddress(
      {
        initializer: ERA_VM_FIXTURE.initializer,
        saltNonce: ERA_VM_FIXTURE.saltNonce,
        singleton: ERA_VM_FIXTURE.singleton,
      },
      ERA_VM_FIXTURE.factory,
      provider,
    )

    expect(address).toBe(ERA_VM_FIXTURE.deployedAddress)
  })

  it('derives the zkSync native CREATE2 address for a 1.4.1 EraVM factory (chain-verified fixture)', async () => {
    const provider = {} as Provider

    const address = await predictSafeAddress(
      {
        initializer: ERA_VM_141_FIXTURE.initializer,
        saltNonce: ERA_VM_141_FIXTURE.saltNonce,
        singleton: ERA_VM_141_FIXTURE.singleton,
      },
      ERA_VM_141_FIXTURE.factory,
      provider,
    )

    expect(address).toBe(ERA_VM_141_FIXTURE.deployedAddress)
  })

  it('derives the EVM CREATE2 address for a canonical factory, even on a zk chain', async () => {
    const call = jest.fn().mockResolvedValue(AbiCoder.defaultAbiCoder().encode(['bytes'], [MOCK_PROXY_CREATION_CODE]))
    const provider = {
      call,
      getNetwork: jest.fn().mockResolvedValue({ chainId: 324n }),
    } as unknown as Provider

    const setupData = {
      initializer: ERA_VM_FIXTURE.initializer,
      saltNonce: '0',
      singleton: CANONICAL_SINGLETON_141,
    }

    const address = await predictSafeAddress(setupData, CANONICAL_FACTORY_141, provider)

    const salt = keccak256(concat([keccak256(setupData.initializer), solidityPacked(['uint256'], ['0'])]))
    const initCode = MOCK_PROXY_CREATION_CODE + solidityPacked(['uint256'], [setupData.singleton]).slice(2)
    expect(address).toBe(getCreate2Address(CANONICAL_FACTORY_141, salt, keccak256(initCode)))
    // The EVM path fetches the creation code from the factory — proof the EraVM branch was not taken.
    expect(call).toHaveBeenCalled()
  })
})
