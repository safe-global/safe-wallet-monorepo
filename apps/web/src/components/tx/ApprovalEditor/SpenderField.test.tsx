import { render, waitFor } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { SpenderField } from './SpenderField'
import * as contractsApi from '@safe-global/store/gateway/AUTO_GENERATED/contracts'
import useChainId from '@/hooks/useChainId'

type UseGetContractQueryResult = ReturnType<typeof contractsApi.useContractsGetContractV1Query>
const mockQueryResult = (result: Partial<UseGetContractQueryResult> = {}): UseGetContractQueryResult =>
  result as unknown as UseGetContractQueryResult

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const useChainIdMock = useChainId as jest.Mock
const useGetContractQueryMock = jest.spyOn(contractsApi, 'useContractsGetContractV1Query')

describe('SpenderField', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useChainIdMock.mockReturnValue('1')
    useGetContractQueryMock.mockReturnValue(mockQueryResult())
  })

  it('clears stale contract data when address becomes invalid', async () => {
    const address = faker.finance.ethereumAddress()
    const contractName = 'ContractName'
    useGetContractQueryMock.mockReturnValue(
      mockQueryResult({ data: { address, name: contractName, displayName: contractName, logoUri: '' } as any }),
    )

    const { rerender, getByText, queryByText } = render(<SpenderField address={address} />)

    await waitFor(() => expect(getByText(contractName)).toBeInTheDocument())

    rerender(<SpenderField address="" />)

    await waitFor(() => expect(queryByText(contractName)).not.toBeInTheDocument())
    const lastCall = useGetContractQueryMock.mock.calls.at(-1) as any
    expect(lastCall[0]).toEqual({ chainId: '1', contractAddress: '' })
    expect(lastCall[1]).toEqual(expect.objectContaining({ skip: true }))
  })
})
