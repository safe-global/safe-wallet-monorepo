import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { EnsPlugin } from 'ethers'
import { createWeb3ReadOnly } from '../web3'

const chain = (chainId: string, shortName: string): Chain =>
  ({
    chainId,
    shortName,
    rpcUri: { authentication: 'NO_AUTHENTICATION', value: 'https://rpc.example' },
  }) as Chain

describe('createWeb3ReadOnly', () => {
  it('points Sepolia at the ENSv2 UniversalResolver', async () => {
    const provider = createWeb3ReadOnly(chain('11155111', 'sep'))!

    const network = await provider.getNetwork()
    const ens = network.getPlugin<EnsPlugin>('org.ethers.plugins.network.Ens')

    expect(ens?.universalResolver).toBe('0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA')
    expect(ens?.address).toBe('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e')
    provider.destroy()
  })

  it('leaves chains without an override on the ethers built-in ENS config', async () => {
    const provider = createWeb3ReadOnly(chain('100', 'gno'))!

    const network = await provider.getNetwork()
    const ens = network.getPlugin<EnsPlugin>('org.ethers.plugins.network.Ens')

    expect(ens?.universalResolver ?? null).not.toBe('0x3c85752a5d47DD09D677C645Ff2A938B38fbFEbA')
    provider.destroy()
  })
})
