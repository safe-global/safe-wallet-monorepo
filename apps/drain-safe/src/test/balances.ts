import { faker } from '@faker-js/faker'
import { getAddress, parseEther, parseUnits, zeroAddress } from 'viem'
import { TokenType, type TokenBalance } from '@safe-global/safe-apps-sdk'

type BalanceOptions = { name?: string; amount?: string; fiatBalance?: string; fiatConversion?: string }

export const nativeBalance = ({
  amount = '1',
  fiatBalance = '2000',
  fiatConversion = '2000',
}: BalanceOptions = {}): TokenBalance => ({
  tokenInfo: {
    type: TokenType.NATIVE_TOKEN,
    address: zeroAddress,
    decimals: 18,
    symbol: 'ETH',
    name: 'Ether',
    logoUri: '',
  },
  balance: parseEther(amount).toString(),
  fiatBalance,
  fiatConversion,
})

export const erc20Balance = ({
  name = faker.finance.currencyName(),
  amount = faker.number.int({ min: 1, max: 1000 }).toString(),
  fiatBalance = faker.number.int({ min: 1, max: 1000 }).toString(),
  fiatConversion = '1',
}: BalanceOptions = {}): TokenBalance => ({
  tokenInfo: {
    type: TokenType.ERC20,
    address: getAddress(faker.finance.ethereumAddress()),
    decimals: 6,
    symbol: faker.finance.currencyCode(),
    name,
    logoUri: '',
  },
  balance: parseUnits(amount, 6).toString(),
  fiatBalance,
  fiatConversion,
})
