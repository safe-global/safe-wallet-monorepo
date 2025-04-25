import type { DmkError, ExecuteDeviceActionReturnType } from '@ledgerhq/device-management-kit'
import { makeError } from 'ethers'
import type {
  GetAddressDAOutput,
  SignPersonalMessageDAOutput,
  SignTransactionDAOutput,
  SignTypedDataDAOutput,
  TypedData,
} from '@ledgerhq/device-signer-kit-ethereum'
import type { Chain, WalletInit, WalletInterface } from '@web3-onboard/common'
import type { Account, Asset, BasePath, DerivationPath, ScanAccountsOptions } from '@web3-onboard/hw-common'
import type { Subscription } from 'rxjs'

const LEDGER_LIVE_PATH: DerivationPath = "44'/60'"
const LEDGER_LEGACY_PATH: DerivationPath = "44'/60'/0'"

const DEFAULT_BASE_PATHS: Array<BasePath> = [
  {
    label: 'Ledger Live',
    value: LEDGER_LIVE_PATH,
  },
  {
    label: 'Ledger Legacy',
    value: LEDGER_LEGACY_PATH,
  },
]

const DEFAULT_ASSETS: Array<Asset> = [
  {
    label: 'ETH',
  },
]

export function ledgerModule(): WalletInit {
  return () => {
    return {
      label: 'Ledger',
      getIcon: async (): Promise<string> => `
<svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="160" height="160" rx="16" fill="#00000D"/>
<path d="M93.1482 119.207V125H135V98.8769H128.902V119.207H93.1482ZM93.1482 33V38.792H128.902V59.1231H135V33H93.1482ZM74.0104 59.1231H67.9125V98.8769H95.4153V93.6539H74.0104V59.1231ZM26 98.8769V125H67.8518V119.207H32.0979V98.8769H26ZM26 33V59.1231H32.0979V38.792H67.8518V33H26Z" fill="white"/>
</svg>`,
      getInterface: async ({ chains, EventEmitter }): Promise<WalletInterface> => {
        const DEFAULT_CHAIN = chains[0]

        const { BigNumber } = await import('@ethersproject/bignumber')
        const { hexaStringToBuffer } = await import('@ledgerhq/device-management-kit')
        const { createEIP1193Provider, ProviderRpcError, ProviderRpcErrorCode } = await import('@web3-onboard/common')
        const { accountSelect, getHardwareWalletProvider } = await import('@web3-onboard/hw-common')
        const { Signature, Transaction, JsonRpcProvider } = await import('ethers')

        const eventEmitter = new EventEmitter()
        const ledgerSdk = await getLedgerSdk()

        /* -------------------------------------------------------------------------- */
        /*                                    State                                   */
        /* -------------------------------------------------------------------------- */

        let currentChain = DEFAULT_CHAIN
        let currentAccount: Account | null = null

        // Sets the current chain and emits the chainChanged event
        function setCurrentChain(chainId: Chain['id']): void {
          const newChain = chains.find((chain) => chain.id === chainId)
          if (!newChain) {
            throw new ProviderRpcError({
              code: ProviderRpcErrorCode.UNRECOGNIZED_CHAIN_ID,
              message: `Unrecognized chain ID: ${chainId}`,
            })
          }
          currentChain = newChain
          eventEmitter.emit('chainChanged', currentChain.id)
        }

        // Sets the current account and emits the accountsChanged event
        function setCurrentAccount(account: Account): void {
          currentAccount = account
          eventEmitter.emit('accountsChanged', [currentAccount.address])
        }

        // Clears the current account and emits the accountsChanged event
        function clearCurrentAccount(): void {
          currentAccount = null
          eventEmitter.emit('accountsChanged', [])
        }

        // Clears the current chain and emits the chainChanged event
        function clearCurrentChain(): void {
          currentChain = DEFAULT_CHAIN
          eventEmitter.emit('chainChanged', currentChain.id)
        }

        // Gets the asserted derivation path from the current account
        function getAssertedDerivationPath(): DerivationPath {
          if (!currentAccount?.derivationPath) {
            throw new ProviderRpcError({
              code: -32000, // Method handler crashed
              message: 'No derivation path found',
            })
          }
          return currentAccount.derivationPath
        }

        /* -------------------------------------------------------------------------- */
        /*                              EIP-1193 provider                             */
        /* -------------------------------------------------------------------------- */

        const eip1193Provider = createEIP1193Provider(
          getHardwareWalletProvider(() => {
            const rpcUrl = currentChain.rpcUrl
            if (!rpcUrl) {
              throw new ProviderRpcError({
                code: ProviderRpcErrorCode.UNRECOGNIZED_CHAIN_ID,
                message: `No RPC found for chain ID: ${currentChain.id}`,
              })
            }
            return rpcUrl
          }),
          {
            eth_requestAccounts: async () => {
              const accounts = await getAccounts()
              return [accounts[0].address]
            },
            eth_selectAccounts: async () => {
              const accounts = await getAccounts()
              return accounts.map((account) => account.address)
            },
            eth_accounts: async () => {
              if (!currentAccount) {
                return []
              }
              return [currentAccount.address]
            },
            eth_chainId: async () => {
              return currentChain.id
            },
            eth_signTransaction: async (args) => {
              const txParams = args.params[0]

              const gasLimit = txParams.gas ?? txParams.gasLimit
              const nonce =
                txParams.nonce ??
                // Safe creation does not provide nonce
                ((await eip1193Provider.request({
                  method: 'eth_getTransactionCount',
                  // Take pending transactions into account
                  params: [currentAccount!.address, 'pending'],
                })) as string)

              const transaction = Transaction.from({
                chainId: BigInt(currentChain.id),
                data: txParams.data,
                gasLimit: gasLimit ? BigInt(gasLimit) : null,
                gasPrice: txParams.gasPrice ? BigInt(txParams.gasPrice) : null,
                maxFeePerGas: txParams.maxFeePerGas ? BigInt(txParams.maxFeePerGas) : null,
                maxPriorityFeePerGas: txParams.maxPriorityFeePerGas ? BigInt(txParams.maxPriorityFeePerGas) : null,
                nonce: parseInt(nonce, 16),
                to: txParams.to,
                value: txParams.value ? BigInt(txParams.value) : null,
              })

              transaction.signature = await ledgerSdk.signTransaction(
                getAssertedDerivationPath(),
                hexaStringToBuffer(transaction.unsignedSerialized)!,
              )

              return transaction.serialized
            },
            eth_sendTransaction: async (args) => {
              const signedTransaction = await eip1193Provider.request({
                method: 'eth_signTransaction',
                params: args.params,
              })
              return (await eip1193Provider.request({
                method: 'eth_sendRawTransaction',
                params: [signedTransaction],
              })) as string
            },
            eth_sign: async (args) => {
              // The Safe requires transactions be signed as bytes, but eth_sign is only used by
              // the Transaction Service, e.g. notification registration. We therefore sign
              // messages as is to avoid unreadable byte notation (e.g. \xef\xbe\xad\xde). Instead,
              // the Ledger device shows plain hex (e.g. 0xdeadbeef).
              const message = args.params[1]
              const signature = await ledgerSdk.signMessage(getAssertedDerivationPath(), message)
              return Signature.from(signature).serialized
            },
            personal_sign: async (args) => {
              // personal_sign params are the inverse of eth_sign
              const [message, address] = args.params
              return await eip1193Provider.request({
                method: 'eth_sign',
                params: [address, message],
              })
            },
            eth_signTypedData: async (args) => {
              const typedData = JSON.parse(args.params[1])
              const signature = await ledgerSdk.signTypedData(getAssertedDerivationPath(), typedData)
              return Signature.from(signature).serialized
            },
            // @ts-expect-error createEIP1193Provider does not allow overriding eth_signTypedData_v3
            eth_signTypedData_v3: async (args) => {
              return await eip1193Provider.request({ method: 'eth_signTypedData', params: args.params })
            },
            // @ts-expect-error createEIP1193Provider does not allow overriding eth_signTypedData_v4
            eth_signTypedData_v4: async (args) => {
              return await eip1193Provider.request({ method: 'eth_signTypedData', params: args.params })
            },
            wallet_switchEthereumChain: async (args) => {
              const chainId = args.params[0].chainId
              setCurrentChain(chainId)
              return null
            },
          },
        )

        // Disconnects Ledger device and clears current account and chain
        eip1193Provider.disconnect = async () => {
          await ledgerSdk.disconnect()
          clearCurrentAccount()
          clearCurrentChain()
        }

        // createEIP1193Provider does not bind EventEmitter
        eip1193Provider.on = eventEmitter.on.bind(eventEmitter)
        eip1193Provider.removeListener = eventEmitter.removeListener.bind(eventEmitter)

        /* -------------------------------------------------------------------------- */
        /*                       Web3-Onboard account selection                       */
        /* -------------------------------------------------------------------------- */

        /**
         * Gets a list of derived accounts from Ledger device for selection
         * and sets the first account as the current account
         */
        async function getAccounts(): Promise<Array<Account>> {
          const accounts = await accountSelect({
            basePaths: DEFAULT_BASE_PATHS,
            assets: DEFAULT_ASSETS,
            chains,
            scanAccounts: deriveAccounts,
          })

          if (accounts.length > 0) {
            setCurrentAccount(accounts[0])
          }

          return accounts
        }

        /**
         * Gets a list of derived accounts from Ledger device for selection
         * If a custom derivation path is provided, one account is returned
         * otherwise a minimum of 5 accounts are returned
         */
        async function deriveAccounts(args: ScanAccountsOptions): Promise<Array<Account>> {
          const MAX_ZERO_BALANCE_ACCOUNTS = 5

          setCurrentChain(args.chainId)

          const provider = new JsonRpcProvider(currentChain.rpcUrl)

          // Only return exact account from custom derivation
          if (args.derivationPath !== LEDGER_LIVE_PATH && args.derivationPath !== LEDGER_LEGACY_PATH) {
            const account = await deriveAccount({ ...args, provider })
            return [account]
          }

          const accounts = []

          let zeroBalanceAccounts = 0
          let index = 0

          // Iterates until 0 balance account, then add 4 more 0 balance accounts after
          while (zeroBalanceAccounts < MAX_ZERO_BALANCE_ACCOUNTS) {
            const account = await deriveAccount({
              derivationPath:
                args.derivationPath === LEDGER_LIVE_PATH
                  ? `${args.derivationPath}/${index}'/0/0`
                  : `${args.derivationPath}/${index}`,
              provider,
              asset: args.asset,
            })
            accounts.push(account)

            if (account.balance.value.isZero()) {
              zeroBalanceAccounts++
            } else {
              zeroBalanceAccounts = 0
            }

            index++
          }

          return accounts
        }

        // Gets derived account from Ledger device for selection in Web3-Onboard
        async function deriveAccount(args: {
          derivationPath: string
          provider: InstanceType<typeof JsonRpcProvider>
          asset: Asset
        }): Promise<Account> {
          const { address } = await ledgerSdk.getAddress(args.derivationPath)
          const balance = await args.provider.getBalance(address)

          return {
            derivationPath: args.derivationPath,
            address,
            balance: {
              asset: args.asset.label,
              value: BigNumber.from(balance),
            },
          }
        }

        return {
          provider: eip1193Provider,
        }
      },
    }
  }
}

const enum LedgerErrorCode {
  REJECTED = '6985',
}

// Promisified Ledger SDK
async function getLedgerSdk() {
  const { DeviceManagementKitBuilder } = await import('@ledgerhq/device-management-kit')
  const { webHidTransportFactory, webHidIdentifier } = await import('@ledgerhq/device-transport-kit-web-hid')
  const { SignerEthBuilder } = await import('@ledgerhq/device-signer-kit-ethereum')
  const { lastValueFrom } = await import('rxjs')

  // Get connected device and create signer
  const dmk = new DeviceManagementKitBuilder().addTransport(webHidTransportFactory).build()
  const device = await lastValueFrom(dmk.startDiscovering({ transport: webHidIdentifier }))
  const sessionId = await dmk.connect({ device })
  const signer = new SignerEthBuilder({ dmk, sessionId }).build()

  return {
    disconnect: async (): Promise<void> => {
      return dmk.disconnect({ sessionId })
    },
    getAddress: async (derivationPath: string): Promise<GetAddressDAOutput> => {
      return waitForAction(signer.getAddress(derivationPath, { checkOnDevice: false }))
    },
    signMessage: async (derivationPath: string, message: string | Uint8Array): Promise<SignPersonalMessageDAOutput> => {
      return waitForAction(signer.signMessage(derivationPath, message))
    },
    signTransaction: async (derivationPath: string, transaction: Uint8Array): Promise<SignTransactionDAOutput> => {
      return waitForAction(signer.signTransaction(derivationPath, transaction))
    },
    signTypedData: async (derivationPath: string, typedData: TypedData): Promise<SignTypedDataDAOutput> => {
      return waitForAction(signer.signTypedData(derivationPath, typedData))
    },
  }
}

async function waitForAction<Output, Error extends DmkError, IntermediateValue>({
  observable,
}: ExecuteDeviceActionReturnType<Output, Error, IntermediateValue>): Promise<Output> {
  const { DeviceActionStatus } = await import('@ledgerhq/device-management-kit')

  let subscription: Subscription | undefined

  try {
    return await new Promise((resolve, reject) => {
      subscription = observable.subscribe({
        next: (actionState) => {
          if (actionState.status === DeviceActionStatus.Completed) {
            resolve(actionState.output)
          } else if (actionState.status === DeviceActionStatus.Error) {
            reject(mapEthersError(actionState.error))
          } else {
            // Awaiting user action, e.g. device to be unlocked. We could throw
            // an explicit error message but we keep the signing request alive
          }
        },
      })
    })
  } finally {
    subscription?.unsubscribe()
  }
}

function mapEthersError(error: DmkError) {
  const isRejection = 'errorCode' in error ? error.errorCode === LedgerErrorCode.REJECTED : false

  if (!isRejection) {
    return makeError(error.message ?? 'unknown', 'UNKNOWN_ERROR', {
      info: error,
    })
  }

  return makeError('user rejected action', 'ACTION_REJECTED', {
    action: 'unknown',
    reason: 'rejected',
    info: error,
  })
}
