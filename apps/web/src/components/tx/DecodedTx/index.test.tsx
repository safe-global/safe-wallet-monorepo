import { fireEvent, render } from '@/tests/test-utils'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import DecodedTx from '.'
import { waitFor } from '@testing-library/react'
import { createMockTransactionDetails } from '@/tests/transactions'
import {
  DetailedExecutionInfoType,
  SettingsInfoType,
  TransactionInfoType,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/safe-gateway-typescript-sdk'
import type { DecodedDataResponse, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

const txDetails = createMockTransactionDetails({
  txInfo: {
    type: TransactionInfoType.SETTINGS_CHANGE,
    humanDescription: 'Add new owner 0xd8dA...6045 with threshold 1',
    dataDecoded: {
      method: 'addOwnerWithThreshold',
      parameters: [
        {
          name: 'owner',
          type: 'address',
          value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        {
          name: '_threshold',
          type: 'uint256',
          value: '1',
        },
      ],
    },
    settingsInfo: {
      type: SettingsInfoType.ADD_OWNER,
      owner: {
        value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        name: 'Nevinha',
        logoUri: 'http://something.com',
      },
      threshold: 1,
    },
  },
  txData: {
    hexData:
      '0x0d582f13000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001',
    dataDecoded: {
      method: 'addOwnerWithThreshold',
      parameters: [
        {
          name: 'owner',
          type: 'address',
          value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
        {
          name: '_threshold',
          type: 'uint256',
          value: '1',
        },
      ],
    },
    to: {
      value: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67',
      name: '',
    },
    value: '0',
    operation: 0,
    trustedDelegateCallTarget: false,
    addressInfoIndex: {
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': {
        value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        name: 'MetaMultiSigWallet',
      },
    },
  },
  detailedExecutionInfo: {
    type: DetailedExecutionInfoType.MULTISIG,
    submittedAt: 1726064794013,
    nonce: 4,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: {
      value: '0x0000000000000000000000000000000000000000',
      name: 'MetaMultiSigWallet',
    },
    safeTxHash: '0x96a96c11b8d013ff5d7a6ce960b22e961046cfa42eff422ac71c1daf6adef2e0',
    signers: [
      {
        value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
        name: '',
      },
    ],
    confirmationsRequired: 1,
    confirmations: [],
    rejectors: [],
    trusted: false,
    proposer: {
      value: '0xDa5e9FA404881Ff36DDa97b41Da402dF6430EE6b',
      name: '',
    },
  },
})
describe('DecodedTx', () => {
  it('should render a native transfer', async () => {
    const result = render(
      <DecodedTx
        showMultisend
        tx={
          {
            data: {
              to: '0x474e5Ded6b5D078163BFB8F6dBa355C3aA5478C8',
              value: '40737664983361196',
              data: '0x',
              operation: 0,
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: '0x0000000000000000000000000000000000000000',
              nonce: 36,
              safeTxGas: '0',
            },
          } as SafeTransaction
        }
        txInfo={{
          type: TransactionInfoType.TRANSFER,
          sender: {
            value: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
          },
          recipient: {
            value: '0x474e5Ded6b5D078163BFB8F6dBa355C3aA5478C8',
          },
          direction: TransferDirection.OUTGOING,
          transferInfo: {
            type: TransactionTokenType.NATIVE_COIN,
            value: '40737664983361196',
          },
        }}
        txData={{
          hexData: '0x',
          dataDecoded: undefined,
          to: {
            value: '0x474e5Ded6b5D078163BFB8F6dBa355C3aA5478C8',
          },
          value: '40737664983361196',
          operation: 0,
          trustedDelegateCallTarget: true,
          addressInfoIndex: undefined,
        }}
      />,
    )

    await waitFor(() => {
      expect(result.queryByText('native transfer')).toBeInTheDocument()
    })

    fireEvent.click(result.getByText('Advanced details'))

    await waitFor(() => {
      expect(result.queryAllByText('safeTxGas:').length).toBeGreaterThan(0)
      expect(result.queryAllByText('Raw data:').length).toBeGreaterThan(0)
    })
  })

  it('should render a transfer with custom data details', async () => {
    const result = render(
      <DecodedTx
        tx={
          {
            data: {
              to: '0x3430d04E42a722c5Ae52C5Bffbf1F230C2677600',
              value: '1000000',
              data: '0x000001ad6abfb9ea000000000000000000000000000000000000000000000000000000000000019d0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000098000000000000000000000000000000000000000000000000000000000000008e4ee8f0b86000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000cd00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000808415565b0000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000f1bd50a00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000004c000000000000000000000000000000000000000000000000000000000000005c0000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000210000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000034000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000002556e6973776170563200000000000000000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000f21a484000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000f164fc0ec4e93095b804a4795bbe1e041497b92a00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000005cf7a000000000000000000000000ad01c20d5886137e056775af56915de824c8fce5000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000010000000000000000000000000000000000000110000000000000000000000000000000000000000ff8513c6b54542145a1b4cf70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000b2c639c533813f4aa9d7837caf62653d097ff850000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000072a600000000000000000000000000000000000000000000000000000000000000cd00000000000000000000000000000000000000000000000000000000000000020000000000000000000000007e8485cf11c370519793d1c2d0a77bd139fdac38000000000000000000000000fea53c695fdf95cfb34514d916ac236e620201bd0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000f2ed992000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000066ed25970000000000000000000000000000000000000000000000000000000066ed799dd00dfeeddeadbeef765753be7f7a64d5509974b0d678e1e3149b02f4',
              operation: 0,
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: '0x0000000000000000000000000000000000000000',
              nonce: 58,
              safeTxGas: '0',
            },
          } as SafeTransaction
        }
        txInfo={txDetails.txInfo}
        txData={
          {
            ...txDetails.txData,
            dataDecoded: {
              method: '',
            } as DecodedDataResponse,
          } as TransactionDetails['txData']
        }
        showMethodCall
      />,
    )

    await waitFor(() => {
      expect(result.queryByText('Interacted with:')).toBeInTheDocument()
      expect(result.queryByText('Data (hex-encoded)')).toBeInTheDocument()
    })

    fireEvent.click(result.getByText('Advanced details'))

    await waitFor(() => {
      expect(result.queryByText('safeTxGas:')).toBeInTheDocument()
      expect(result.queryByText('Raw data:')).toBeInTheDocument()
    })
  })

  it('should render an ERC20 transfer', async () => {
    const result = render(
      <DecodedTx
        showMethodCall
        showMultisend={false}
        tx={
          {
            data: {
              to: '0x3430d04E42a722c5Ae52C5Bffbf1F230C2677600',
              value: '0',
              data: '0xa9059cbb000000000000000000000000474e5ded6b5d078163bfb8f6dba355c3aa5478c80000000000000000000000000000000000000000000000008ac7230489e80000',
              operation: 0,
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: '0x0000000000000000000000000000000000000000',
              nonce: 58,
              safeTxGas: '0',
            },
          } as SafeTransaction
        }
        txInfo={txDetails.txInfo}
        txData={
          {
            ...txDetails.txData,
            dataDecoded: {
              method: 'transfer',
              parameters: [
                {
                  name: 'to',
                  type: 'address',
                  value: '0x474e5Ded6b5D078163BFB8F6dBa355C3aA5478C8',
                },
                {
                  name: 'value',
                  type: 'uint256',
                  value: '16745726664999765048',
                },
              ],
            },
          } as TransactionDetails['txData']
        }
      />,
    )

    fireEvent.click(result.getByText('Advanced details'))

    await waitFor(() => {
      expect(result.queryByText('transfer')).toBeInTheDocument()
      expect(result.queryAllByText('Parameters').length).toBeGreaterThan(0)
      expect(result.queryByText('to')).toBeInTheDocument()
      expect(result.queryAllByText('address').length).toBeGreaterThan(0)
      expect(result.queryByText('0x474e...78C8')).toBeInTheDocument()
      expect(result.queryByText('value')).toBeInTheDocument()
      expect(result.queryAllByText('uint256').length).toBeGreaterThan(0)
      expect(result.queryByText('16745726664999765048')).toBeInTheDocument()
    })
  })

  it('should render a multisend transaction', async () => {
    const result = render(
      <DecodedTx
        tx={
          {
            data: {
              to: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
              value: '0',
              data: '0x8d80ff00',
              operation: 1,
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: '0x0000000000000000000000000000000000000000',
              nonce: 58,
              safeTxGas: '0',
            },
          } as SafeTransaction
        }
        txInfo={txDetails.txInfo}
        txData={
          {
            ...txDetails.txData,
            dataDecoded: {
              method: 'multiSend',
              parameters: [
                {
                  name: 'transactions',
                  type: 'bytes',
                  value: '0x0057f1887a8bf19b14fc0df',
                  valueDecoded: [
                    {
                      operation: 0,
                      to: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
                      value: '0',
                      data: '0x42842e0e0000000000000000000',
                      dataDecoded: {
                        method: 'safeTransferFrom',
                        parameters: [
                          {
                            name: 'from',
                            type: 'address',
                            value: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
                          },
                          {
                            name: 'to',
                            type: 'address',
                            value: '0x474e5Ded6b5D078163BFB8F6dBa355C3aA5478C8',
                          },
                          {
                            name: 'tokenId',
                            type: 'uint256',
                            value: '52964617156216674852059480948658573966398315289847646343083345905048987083870',
                          },
                        ],
                      },
                    },
                    {
                      operation: 0,
                      to: '0xD014e20A75437a4bd0FbB40498FF94e6F337c3e9',
                      value: '0',
                      data: '0x42842e0e000000000000000000000000a77de',
                      dataDecoded: {
                        method: 'safeTransferFrom',
                        parameters: [
                          {
                            name: 'from',
                            type: 'address',
                            value: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
                          },
                          {
                            name: 'to',
                            type: 'address',
                            value: '0x474e5Ded6b5D078163BFB8F6dBa355C3aA5478C8',
                          },
                          {
                            name: 'tokenId',
                            type: 'uint256',
                            value: '412',
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          } as TransactionDetails['txData']
        }
        showMethodCall
        showMultisend
      />,
    )

    expect(result.queryAllByText('safeTransferFrom').length).toBeGreaterThan(1)
  })

  it('should render a function call without parameters', async () => {
    const result = render(
      <DecodedTx
        tx={
          {
            data: {
              to: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
              value: '5000000000000',
              data: '0xd0e30db0',
              operation: 0,
              baseGas: '0',
              gasPrice: '0',
              gasToken: '0x0000000000000000000000000000000000000000',
              refundReceiver: '0x0000000000000000000000000000000000000000',
              nonce: 58,
              safeTxGas: '0',
            },
          } as SafeTransaction
        }
        showMultisend={false}
        txInfo={txDetails.txInfo}
        txData={
          {
            ...txDetails.txData,
            dataDecoded: {
              method: 'deposit',
              parameters: [],
            },
          } as TransactionDetails['txData']
        }
        showMethodCall
      />,
    )

    fireEvent.click(result.getByText('Advanced details'))

    expect(result.queryByText('deposit')).toBeInTheDocument()
  })
})
