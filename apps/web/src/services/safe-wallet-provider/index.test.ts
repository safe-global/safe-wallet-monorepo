// Unit tests for the SafeWalletProvider class
import { faker } from '@faker-js/faker'
import { SafeWalletProvider } from '.'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { numberToHex } from '@/utils/hex'
import type { TransactionReceipt } from 'ethers'

const safe = {
  safeAddress: faker.finance.ethereumAddress(),
  chainId: 1,
}

const appInfo = {
  id: 1,
  name: 'test',
  description: 'test',
  iconUrl: 'test',
  url: 'test',
}

describe('SafeWalletProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('wallet_switchEthereumChain', () => {
    it('should call the switchChain method when the method is wallet_switchEthereumChain', async () => {
      const switchChain = jest.fn()
      const sdk = {
        switchChain,
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      await safeWalletProvider.request(
        1,
        { method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] } as any,
        {} as any,
      )

      expect(switchChain).toHaveBeenCalledWith('0x1', {})
    })

    it('should throw an error when the chain is not supported', async () => {
      const sdk = {
        switchChain: jest.fn().mockRejectedValue(new Error('Unsupported chain')),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      await expect(
        safeWalletProvider.request(
          1,
          { method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] } as any,
          {} as any,
        ),
      ).resolves.toEqual({
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Unsupported chain',
        },
      })
    })
  })

  describe('eth_accounts', () => {
    it('should return the safe address when the method is eth_accounts', async () => {
      const sdk = {}
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const result = await safeWalletProvider.request(1, { method: 'eth_accounts' } as any, {} as any)

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: [safe.safeAddress],
      })
    })
  })
  ;['net_version', 'eth_chainId'].forEach((method) => {
    describe(method, () => {
      it(`should return the chain id when the method is ${method}`, async () => {
        const sdk = {}
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const result = await safeWalletProvider.request(1, { method } as any, {} as any)

        expect(result).toEqual({
          id: 1,
          jsonrpc: '2.0',
          result: '0x1',
        })
      })
    })
  })

  describe('personal_sign', () => {
    it('should throw an error when the address is invalid', async () => {
      const sdk = {
        signMessage: jest.fn().mockResolvedValue({ signature: '0x123' }),
      }

      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      await expect(
        safeWalletProvider.request(1, { method: 'personal_sign', params: ['message', '0x456'] } as any, {} as any),
      ).resolves.toEqual({
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'The address or message hash is invalid',
        },
      })
    })

    it('should throw an error when the message hash is invalid', async () => {
      const sdk = {
        signMessage: jest.fn().mockResolvedValue({ signature: '0x123' }),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      await expect(
        safeWalletProvider.request(1, { method: 'personal_sign', params: ['message', '123'] } as any, {} as any),
      ).resolves.toEqual({
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'The address or message hash is invalid',
        },
      })
    })

    it('should return an empty string when the signature is undefined', async () => {
      const sdk = {
        signMessage: jest.fn().mockResolvedValue({}),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const result = await safeWalletProvider.request(
        1,
        { method: 'personal_sign', params: ['message', safe.safeAddress] } as any,
        {} as any,
      )

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: '0x',
      })
    })
  })

  describe('eth_sign', () => {
    it('should return the signature when the method is eth_sign', async () => {
      const sdk = {
        signMessage: jest.fn().mockResolvedValue({ signature: '0x123' }),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const result = await safeWalletProvider.request(
        1,
        { method: 'eth_sign', params: [safe.safeAddress, '0x345'] } as any,
        {} as any,
      )

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: '0x123',
      })
    })

    it('should throw an error when the address is invalid', async () => {
      const sdk = {
        signMessage: jest.fn().mockResolvedValue({ signature: '0x123' }),
      }

      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      await expect(
        safeWalletProvider.request(1, { method: 'eth_sign', params: ['0x456', '0x456'] } as any, {} as any),
      ).resolves.toEqual({
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'The address or message hash is invalid',
        },
      })
    })

    it('should throw an error when the message hash is invalid', async () => {
      const sdk = {
        signMessage: jest.fn().mockResolvedValue({ signature: '0x123' }),
      }

      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      await expect(
        safeWalletProvider.request(1, { method: 'eth_sign', params: ['0x123', 'messageHash'] } as any, {} as any),
      ).resolves.toEqual({
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'The address or message hash is invalid',
        },
      })
    })

    it('should return an empty string when the signature is undefined', async () => {
      const sdk = {
        signMessage: jest.fn().mockResolvedValue({}),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const result = await safeWalletProvider.request(
        1,
        { method: 'eth_sign', params: [safe.safeAddress, '0x123'] } as any,
        {} as any,
      )

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: '0x',
      })
    })
  })
  ;['eth_signTypedData', 'eth_signTypedData_v4'].forEach((method) => {
    describe(method, () => {
      it(`should return the signature when the method is ${method}`, async () => {
        const sdk = {
          signTypedMessage: jest.fn().mockResolvedValue({ signature: '0x123' }),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const result = await safeWalletProvider.request(
          1,
          {
            method,
            params: [
              safe.safeAddress,
              {
                domain: {
                  chainId: 1,
                  name: 'test',
                  version: '1',
                },
                message: {
                  test: 'test',
                },
              },
            ],
          } as any,
          {} as any,
        )

        expect(result).toEqual({
          id: 1,
          jsonrpc: '2.0',
          result: '0x123',
        })
      })

      it('should throw an error when the address is invalid', async () => {
        const sdk = {
          signTypedMessage: jest.fn().mockResolvedValue({ signature: '0x123' }),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        await expect(
          safeWalletProvider.request(1, { method, params: ['0x456', {}] } as any, {} as any),
        ).resolves.toEqual({
          id: 1,
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'The address is invalid',
          },
        })
      })

      it('should return an empty string when the signature is undefined', async () => {
        const sdk = {
          signTypedMessage: jest.fn().mockResolvedValue({}),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const result = await safeWalletProvider.request(
          1,
          {
            method,
            params: [
              safe.safeAddress,
              {
                domain: {
                  chainId: 1,
                  name: 'test',
                  version: '1',
                },
                message: {
                  test: 'test',
                },
              },
            ],
          } as any,
          {} as any,
        )

        expect(result).toEqual({
          id: 1,
          jsonrpc: '2.0',
          result: '0x',
        })
      })
    })
  })

  describe('eth_sendTransaction', () => {
    it('should return the transaction safeTxHash when the method is eth_sendTransaction', async () => {
      const sdk = {
        send: jest.fn().mockResolvedValue({ safeTxHash: '0x456' }),
      }
      const toAddress = faker.finance.ethereumAddress()
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const result = await safeWalletProvider.request(
        1,
        {
          method: 'eth_sendTransaction',
          params: [{ from: safe.safeAddress, to: toAddress, value: '0x01', gas: 1000 }],
        } as any,
        appInfo,
      )

      expect(sdk.send).toHaveBeenCalledWith(
        {
          txs: [{ from: safe.safeAddress, to: toAddress, value: '0x01', gas: 1000, data: '0x' }],
          params: { safeTxGas: 1000 },
        },
        appInfo,
      )

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: '0x456',
      })
    })

    it('should throw an error when the transaction is not signed by the safe', async () => {
      const sdk = {
        send: jest.fn().mockRejectedValue(new Error('User rejected the transaction')),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      await expect(
        safeWalletProvider.request(
          1,
          { method: 'eth_sendTransaction', params: [{ from: '0x123', to: '0x123', value: '0x123' }] } as any,
          appInfo,
        ),
      ).resolves.toEqual({
        id: 1,
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'User rejected the transaction',
        },
      })
    })

    it('should format the gas when it is passed as a hex-encoded string', async () => {
      const sdk = {
        send: jest.fn().mockResolvedValue({ safeTxHash: '0x456' }),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const result = await safeWalletProvider.request(
        1,
        {
          method: 'eth_sendTransaction',
          params: [
            {
              from: '0x123',
              to: '0x123',
              value: '0x123',
              gas: 0x3e8, // 1000
            },
          ],
        } as any,
        appInfo,
      )

      expect(sdk.send).toHaveBeenCalledWith(
        { txs: [{ from: '0x123', to: '0x123', value: '0x123', gas: 1000, data: '0x' }], params: { safeTxGas: 1000 } },
        appInfo,
      )

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: '0x456',
      })
    })
  })

  describe('eth_getTransactionByHash', () => {
    it('should return the transaction when the method is eth_getTransactionByHash', async () => {
      const sdk = {
        getBySafeTxHash: jest.fn().mockResolvedValue({ txHash: '0x777' }),
        proxy: jest.fn().mockResolvedValue({ hash: '0x999' }),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const result = await safeWalletProvider.request(
        1,
        { method: 'eth_getTransactionByHash', params: ['0x123'] } as any,
        appInfo,
      )

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: { hash: '0x999' },
      })
    })

    it('should send a transaction and return the transaction when it is in the submitted transactions', async () => {
      const sdk = {
        send: jest.fn().mockResolvedValue({ safeTxHash: '0x777' }),
        getBySafeTxHash: jest.fn().mockResolvedValue({ txHash: '0x777' }),
        proxy: jest.fn().mockResolvedValue({ hash: '0x999' }),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const toAddress = faker.finance.ethereumAddress()

      // Send the transaction
      await safeWalletProvider.request(
        1,
        {
          method: 'eth_sendTransaction',
          params: [{ from: safe.safeAddress, to: toAddress, value: '0x01', gas: 1000 }],
        } as any,
        appInfo,
      )

      const result = await safeWalletProvider.request(
        1,
        { method: 'eth_getTransactionByHash', params: ['0x777'] } as any,
        appInfo,
      )

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: {
          blockHash: null,
          blockNumber: null,
          from: safe.safeAddress,
          gas: 0,
          gasPrice: '0x00',
          hash: '0x777',
          input: '0x',
          nonce: 0,
          to: toAddress,
          transactionIndex: null,
          value: '0x01',
        },
      })
    })
  })

  describe('eth_getTransactionReceipt', () => {
    it('should return the transaction receipt when the method is eth_getTransactionReceipt', async () => {
      const sdk = {
        getBySafeTxHash: jest.fn().mockResolvedValue({ txHash: '0x777' }),
        proxy: jest.fn().mockResolvedValue({ hash: '0x999' }),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      const result = await safeWalletProvider.request(
        1,
        { method: 'eth_getTransactionReceipt', params: ['0x123'] } as any,
        appInfo,
      )

      expect(result).toEqual({
        id: 1,
        jsonrpc: '2.0',
        result: { hash: '0x999' },
      })
    })
  })

  describe('proxy', () => {
    it('should default to using the proxy if the method is not supported by the provider', async () => {
      const sdk = {
        proxy: jest.fn(),
      }
      const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

      await safeWalletProvider.request(1, { method: 'web3_clientVersion', params: [''] } as any, appInfo)

      expect(sdk.proxy).toHaveBeenCalledWith('web3_clientVersion', [''])
    })
  })

  describe('EIP-5792', () => {
    describe('wallet_sendCalls', () => {
      it('should send a bundle', async () => {
        const sdk = {
          send: jest.fn(),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const params = [
          {
            chainId: 1,
            version: '1.0',
            from: faker.finance.ethereumAddress(),
            calls: [
              { data: '0x123', to: faker.finance.ethereumAddress(), value: '0x123' },
              { data: '0x456', to: faker.finance.ethereumAddress(), value: '0x1' },
            ],
          },
        ]

        await safeWalletProvider.request(1, { method: 'wallet_sendCalls', params } as any, appInfo)

        expect(sdk.send).toHaveBeenCalledWith(
          {
            txs: params[0].calls,
            params: { safeTxGas: 0 },
          },
          {
            description: 'test',
            iconUrl: 'test',
            id: 1,
            name: 'test',
            url: 'test',
          },
        )
      })

      it('test contract deployment calls and calls without data / value', async () => {
        const fakeCreateCallLib = faker.finance.ethereumAddress()
        const sdk = {
          send: jest.fn(),
          getCreateCallTransaction: jest.fn().mockImplementation((data: string) => {
            return {
              to: fakeCreateCallLib,
              data,
              value: '0',
            }
          }),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)
        const transferReceiver = faker.finance.ethereumAddress()
        const erc20Address = faker.finance.ethereumAddress()
        const erc20TransferData = ERC20__factory.createInterface().encodeFunctionData('transfer', [
          transferReceiver,
          '100',
        ])
        const nativeTransferTo = faker.finance.ethereumAddress()

        const params = [
          {
            chainId: 1,
            version: '1.0',
            from: safe.safeAddress,
            calls: [
              { data: '0x1234' },
              { data: '0x', to: nativeTransferTo, value: '0x1' },
              {
                to: erc20Address,
                data: erc20TransferData,
              },
            ],
          },
        ]

        await safeWalletProvider.request(1, { method: 'wallet_sendCalls', params } as any, appInfo)

        expect(sdk.send).toHaveBeenCalledWith(
          {
            txs: [
              {
                to: fakeCreateCallLib,
                data: '0x1234',
                value: '0',
              },
              {
                to: nativeTransferTo,
                data: '0x',
                value: '0x1',
              },
              {
                to: erc20Address,
                data: erc20TransferData,
                value: '0',
              },
            ],
            params: { safeTxGas: 0 },
          },
          {
            description: 'test',
            iconUrl: 'test',
            id: 1,
            name: 'test',
            url: 'test',
          },
        )
      })
    })

    describe('wallet_getCallsStatus', () => {
      it('should return a confirmed transaction if blockNumber/gasUsed are hex', async () => {
        const receipt: Pick<TransactionReceipt, 'logs' | 'blockHash' | 'blockNumber' | 'gasUsed'> = {
          logs: [],
          blockHash: numberToHex(Number(faker.string.hexadecimal())),
          // Typed as number/bigint; is hex
          blockNumber: numberToHex(Number(faker.string.hexadecimal())) as unknown as number,
          gasUsed: numberToHex(Number(faker.string.hexadecimal())) as unknown as bigint,
        }
        const sdk = {
          getBySafeTxHash: jest.fn().mockResolvedValue({
            txStatus: 'SUCCESS',
            txHash: '0x123',
            txData: {
              dataDecoded: {
                parameters: [{ valueDecoded: [1] }],
              },
            },
          }),
          proxy: jest.fn().mockImplementation((method) => {
            if (method === 'eth_getTransactionReceipt') {
              return Promise.resolve(receipt)
            }
            return Promise.reject('Unknown method')
          }),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const params = ['0x123']

        const status = await safeWalletProvider.request(1, { method: 'wallet_getCallsStatus', params } as any, appInfo)

        expect(sdk.getBySafeTxHash).toHaveBeenCalledWith(params[0])
        expect(sdk.proxy).toHaveBeenCalledWith('eth_getTransactionReceipt', params)
        expect(status).toStrictEqual({
          id: 1,
          jsonrpc: '2.0',
          result: {
            receipts: [
              {
                blockHash: receipt.blockHash,
                blockNumber: receipt.blockNumber,
                chainId: '0x1',
                gasUsed: receipt.gasUsed,
                logs: receipt.logs,
                status: '0x1',
                transactionHash: '0x123',
              },
            ],
            status: 'CONFIRMED',
          },
        })
      })

      it('should return a confirmed transaction if blockNumber/gasUsed are number/bigint', async () => {
        const receipt: Pick<TransactionReceipt, 'logs' | 'blockHash' | 'blockNumber' | 'gasUsed'> = {
          logs: [],
          blockHash: numberToHex(Number(faker.string.hexadecimal())),
          blockNumber: faker.number.int(),
          gasUsed: faker.number.bigInt(),
        }
        const sdk = {
          getBySafeTxHash: jest.fn().mockResolvedValue({
            txStatus: 'SUCCESS',
            txHash: '0x123',
            txData: {
              dataDecoded: {
                parameters: [{ valueDecoded: [1] }],
              },
            },
          }),
          proxy: jest.fn().mockImplementation((method) => {
            if (method === 'eth_getTransactionReceipt') {
              return Promise.resolve(receipt)
            }
            return Promise.reject('Unknown method')
          }),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const params = ['0x123']

        const status = await safeWalletProvider.request(1, { method: 'wallet_getCallsStatus', params } as any, appInfo)

        expect(sdk.getBySafeTxHash).toHaveBeenCalledWith(params[0])
        expect(sdk.proxy).toHaveBeenCalledWith('eth_getTransactionReceipt', params)
        expect(status).toStrictEqual({
          id: 1,
          jsonrpc: '2.0',
          result: {
            receipts: [
              {
                blockHash: numberToHex(Number(receipt.blockHash)),
                blockNumber: numberToHex(Number(receipt.blockNumber)),
                chainId: '0x1',
                gasUsed: numberToHex(receipt.gasUsed),
                logs: receipt.logs,
                status: '0x1',
                transactionHash: '0x123',
              },
            ],
            status: 'CONFIRMED',
          },
        })
      })

      it('should return a pending status w/o txHash', async () => {
        const sdk = {
          getBySafeTxHash: jest.fn().mockResolvedValue({
            txStatus: 'AWAITING_EXECUTION',
            txData: {
              dataDecoded: {
                parameters: [{ valueDecoded: [1] }],
              },
            },
          }),
          proxy: jest.fn(),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const params = ['0x123']

        const status = await safeWalletProvider.request(1, { method: 'wallet_getCallsStatus', params } as any, appInfo)

        expect(sdk.getBySafeTxHash).toHaveBeenCalledWith(params[0])
        expect(sdk.proxy).not.toHaveBeenCalled()
        expect(status).toStrictEqual({
          id: 1,
          jsonrpc: '2.0',
          result: {
            status: 'PENDING',
          },
        })
      })

      it('should return a pending status w/o receipt', async () => {
        const sdk = {
          getBySafeTxHash: jest.fn().mockResolvedValue({
            txStatus: 'AWAITING_EXECUTION',
            txHash: '0x123',
            txData: {
              dataDecoded: {
                parameters: [{ valueDecoded: [1] }],
              },
            },
          }),
          proxy: jest.fn().mockImplementation((method) => {
            if (method === 'eth_getTransactionReceipt') {
              return Promise.resolve(null)
            }
            return Promise.reject('Unknown method')
          }),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const params = ['0x123']

        const status = await safeWalletProvider.request(1, { method: 'wallet_getCallsStatus', params } as any, appInfo)

        expect(sdk.getBySafeTxHash).toHaveBeenCalledWith(params[0])
        expect(sdk.proxy).toHaveBeenCalledWith('eth_getTransactionReceipt', params)
        expect(status).toStrictEqual({
          id: 1,
          jsonrpc: '2.0',
          result: {
            status: 'PENDING',
          },
        })
      })
    })

    describe('wallet_showCallsStatus', () => {
      it('should return the bundle status', async () => {
        const sdk = {
          showTxStatus: jest.fn(),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const params = ['0x123']

        await safeWalletProvider.request(1, { method: 'wallet_showCallsStatus', params } as any, appInfo)

        expect(sdk.showTxStatus).toHaveBeenCalledWith(params[0])
      })
    })

    describe('wallet_getCapabilities', () => {
      it('should return atomic batch for the current chain', async () => {
        const sdk = {
          showTxStatus: jest.fn(),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const params = [safe.safeAddress]

        const result = await safeWalletProvider.request(1, { method: 'wallet_getCapabilities', params } as any, appInfo)

        expect(result).toEqual({
          id: 1,
          jsonrpc: '2.0',
          result: {
            ['0x1']: {
              atomicBatch: {
                supported: true,
              },
            },
          },
        })
      })

      it('should return an empty object if the safe address does not match', async () => {
        const sdk = {
          showTxStatus: jest.fn(),
        }
        const safeWalletProvider = new SafeWalletProvider(safe, sdk as any)

        const params = [faker.finance.ethereumAddress()]

        const result = await safeWalletProvider.request(1, { method: 'wallet_getCapabilities', params } as any, appInfo)

        expect(result).toEqual({
          id: 1,
          jsonrpc: '2.0',
          result: {},
        })
      })
    })
  })
})
