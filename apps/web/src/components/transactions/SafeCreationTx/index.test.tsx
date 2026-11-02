import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import SafeCreationTx from '.'

describe('SafeCreationTx', () => {
  it('shows the creator, factory and mastercopy of a Safe creation', () => {
    const creator = faker.finance.ethereumAddress()
    const factory = faker.finance.ethereumAddress()
    const mastercopy = faker.finance.ethereumAddress()
    const creation = safeTxSummaryBuilder()
      .with({
        txInfo: {
          type: 'Creation',
          creator: { value: creator },
          factory: { value: factory, name: 'SafeProxyFactory 1.3.0' },
          implementation: { value: mastercopy, name: 'SafeL2 1.3.0' },
          transactionHash: faker.string.hexadecimal({ length: 64 }),
        },
      })
      .build()

    render(<SafeCreationTx txSummary={creation} />)

    expect(screen.getByText('Creator:')).toBeInTheDocument()
    expect(screen.getByText('Factory:')).toBeInTheDocument()
    expect(screen.getByText('Mastercopy:')).toBeInTheDocument()
    expect(screen.getByText('SafeProxyFactory 1.3.0')).toBeInTheDocument()
    expect(screen.getByText('SafeL2 1.3.0')).toBeInTheDocument()
    expect(screen.getByText(creator)).toBeInTheDocument()
    expect(screen.getByText(factory)).toBeInTheDocument()
    expect(screen.getByText(mastercopy)).toBeInTheDocument()
  })
})
