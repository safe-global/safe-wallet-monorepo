import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { type WalletContextType } from '@/components/common/WalletProvider/WalletContext'
import { faker } from '@faker-js/faker'
import { Builder, type IBuilder } from '../Builder'
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

export const walletContextBuilder = (): IBuilder<WalletContextType> => {
  return Builder.new<WalletContextType>().with({
    connectedWallet: null,
    signer: null,
    setSignerAddress: () => {},
    getParentSafeNonce: () => undefined,
    setParentSafeNonce: () => {},
    clearParentSafeNonce: () => {},
    isReady: true,
  })
}
