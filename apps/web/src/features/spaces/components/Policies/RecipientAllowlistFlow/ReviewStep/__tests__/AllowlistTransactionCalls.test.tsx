import { faker } from '@faker-js/faker'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type MetaTransactionData } from '@safe-global/types-kit'
import { Interface } from 'ethers'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { safeTxBuilder, safeTxDataBuilder } from '@/tests/builders/safeTx'
import type { PolicyConfiguration, PolicyGuardContract } from '@/features/policy-guard'
import AllowlistTransactionCalls from '../AllowlistTransactionCalls'

const SAFE = checksumAddress(faker.finance.ethereumAddress())
const GUARD = checksumAddress(faker.finance.ethereumAddress())
const USDC = checksumAddress(faker.finance.ethereumAddress())
const POLICY = checksumAddress(faker.finance.ethereumAddress())
const RECIPIENT = checksumAddress(faker.finance.ethereumAddress())
const OTHER = checksumAddress(faker.finance.ethereumAddress())
const MULTI_SEND = checksumAddress(faker.finance.ethereumAddress())

const encoders: Pick<
  PolicyGuardContract,
  | 'createFirstSetupTxs'
  | 'createRequestConfigurationTx'
  | 'createApplyConfigurationTx'
  | 'getConfigurationRoot'
  | 'describeSetupCall'
  | 'getCallConfigurations'
> = jest.requireActual('@/features/policy-guard/services/policyGuardEncoders')
const {
  decodeErc20TransferPolicyData: mockDecodeRecipients,
  encodeErc20TransferPolicyData,
}: Pick<PolicyGuardContract, 'decodeErc20TransferPolicyData'> & {
  encodeErc20TransferPolicyData: (recipients: string[]) => string
} = jest.requireActual('@/features/policy-guard/services/allowlistConfigurations')
const mockDescribeSetupCall = encoders.describeSetupCall
const mockGetCallConfigurations = encoders.getCallConfigurations
const mockResolveName = (address: string): string => (address === RECIPIENT ? 'Alice' : '')

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: () => ({
    $isReady: true,
    describeSetupCall: mockDescribeSetupCall,
    decodeErc20TransferPolicyData: mockDecodeRecipients,
    getCallConfigurations: mockGetCallConfigurations,
  }),
}))
jest.mock('../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions', () => ({
  __esModule: true,
  default: () => ({ options: [] }),
}))
jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
  useAddressBookItem: () => undefined,
  useMergedAddressBooks: () => ({ list: [], has: () => false, get: () => undefined }),
  useSafeNameResolver: () => mockResolveName,
}))

const configurationFor = (recipients: string[]): PolicyConfiguration => ({
  target: USDC,
  selector: '0xa9059cbb',
  operation: 0,
  policy: POLICY,
  data: encodeErc20TransferPolicyData(recipients),
})

const multiSendInterface = new Interface(['function multiSend(bytes transactions)'])

const safeTxOf = (call: Pick<MetaTransactionData, 'to' | 'data'> & { operation?: OperationType }) =>
  safeTxBuilder()
    .with({
      data: safeTxDataBuilder()
        .with({ to: call.to, value: '0', data: call.data, operation: call.operation ?? OperationType.Call })
        .build(),
    })
    .build()

const multiSendOf = (calls: MetaTransactionData[]) =>
  safeTxOf({
    to: MULTI_SEND,
    data: multiSendInterface.encodeFunctionData('multiSend', [
      encodeMultiSendData(calls.map((call) => ({ ...call, operation: OperationType.Call }))),
    ]),
    operation: OperationType.DelegateCall,
  })

const actionLabels = () => screen.getAllByTestId('action-item').map((item) => item.textContent)

describe('AllowlistTransactionCalls', () => {
  it('should list every call of the setup and its rules, when the setup is a MultiSend that configures immediately', () => {
    const configurations = [configurationFor([RECIPIENT])]
    const safeTx = multiSendOf(encoders.createFirstSetupTxs({ safeAddress: SAFE, guardAddress: GUARD, configurations }))
    render(<AllowlistTransactionCalls safeTx={safeTx} />)

    expect(actionLabels()).toEqual(['1SafePolicyGuard: configureImmediately', '2setGuard', '3setModuleGuard'])

    fireEvent.click(screen.getAllByTestId('action-item')[0])

    const [rule] = screen.getAllByTestId('allowlist-rule')
    expect(rule).toHaveTextContent('Rule 1 of 1')
    expect(within(rule).getByText('Token withdraw allowlist')).toBeInTheDocument()
    expect(within(rule).getByText('Alice')).toBeInTheDocument()
  })

  it('should list the rules being applied, when the transaction applies a configuration', () => {
    const configurations = [configurationFor([RECIPIENT, OTHER])]
    render(<AllowlistTransactionCalls safeTx={safeTxOf(encoders.createApplyConfigurationTx(GUARD, configurations))} />)

    expect(actionLabels()).toEqual(['1SafePolicyGuard: applyConfiguration'])

    fireEvent.click(screen.getByTestId('action-item'))

    const [rule] = screen.getAllByTestId('allowlist-rule')
    expect(rule).toHaveTextContent('Rule 1 of 1')
    expect(rule).toHaveTextContent(OTHER)
  })

  it('should list the requested rules, when they hash to the root of the request', () => {
    const configurations = [configurationFor([RECIPIENT])]
    const request = encoders.createRequestConfigurationTx(GUARD, encoders.getConfigurationRoot(configurations))
    render(<AllowlistTransactionCalls safeTx={safeTxOf(request)} requestedConfigurations={configurations} />)

    fireEvent.click(screen.getByTestId('action-item'))

    expect(screen.getByTestId('allowlist-rule')).toHaveTextContent('Rule 1 of 1')
  })

  it('should list no rules, when the requested configurations do not hash to the root of the request', () => {
    const request = encoders.createRequestConfigurationTx(
      GUARD,
      encoders.getConfigurationRoot([configurationFor([RECIPIENT])]),
    )
    render(
      <AllowlistTransactionCalls safeTx={safeTxOf(request)} requestedConfigurations={[configurationFor([OTHER])]} />,
    )

    expect(actionLabels()).toEqual(['1SafePolicyGuard: requestConfiguration'])

    fireEvent.click(screen.getByTestId('action-item'))

    expect(screen.queryByTestId('allowlist-rule')).not.toBeInTheDocument()
  })

  it('should render nothing, when the transaction has not been built yet', () => {
    const { container } = render(<AllowlistTransactionCalls />)

    expect(container).toBeEmptyDOMElement()
  })
})
