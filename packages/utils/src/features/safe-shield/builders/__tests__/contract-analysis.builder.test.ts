import { StatusGroup } from '../../types'
import { ContractAnalysisBuilder } from '../contract-analysis.builder'
import { DEFAULT_INFO } from '../contract-address.builder'

const address = '0x0000000000000000000000000000000000000001'
const defaultDetails = { name: 'BAL BAL EXAMPLE CONTRACT', logoUrl: 'https://placehold.co/160' }

describe('ContractAnalysisBuilder', () => {
  it('does not carry findings from one built analysis into another for the same address', () => {
    ContractAnalysisBuilder.unofficialFallbackHandlerContract(address).build()

    const [contracts] = ContractAnalysisBuilder.knownContract(address).build()

    expect(contracts?.[address]).toEqual({
      ...defaultDetails,
      [StatusGroup.CONTRACT_INTERACTION]: expect.any(Array),
    })
  })

  it('does not change the default contract details', () => {
    new ContractAnalysisBuilder().addAddress(address).addName('Balancer').addLogoUrl('https://example.com/logo')

    expect(DEFAULT_INFO).toEqual(defaultDetails)
  })
})
