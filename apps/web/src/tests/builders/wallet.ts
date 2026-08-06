import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { faker } from '@faker-js/faker'
import { Builder, type IBuilder } from '@safe-global/utils/tests/Builder'
import { eip1193ProviderBuilder } from './eip1193Provider'

const walletNames = ['MetaMask', 'Wallet Connect', 'Rainbow']

export const connectedWalletBuilder = (): IBuilder<ConnectedWallet> => {
  return Builder.new<ConnectedWallet>().with({
    address: faker.finance.ethereumAddress(),
    chainId: faker.string.numeric(),
    ens: faker.string.alpha() + '.ens',
    label: faker.helpers.arrayElement(walletNames),
    provider: eip1193ProviderBuilder().build(),
  })
}
