import type { Transaction } from 'ethers'
import type { Chain, WalletInit, WalletInterface } from '@web3-onboard/common'
import type { Account, Asset, ScanAccountsOptions } from '@web3-onboard/hw-common'
import type { EthereumSignTypedDataMessage, EthereumSignTypedDataTypes } from '@trezor/connect-web'
import type { TrezorTransaction } from './types'
import { TREZOR_LIVE_PATH, TREZOR_LEGACY_PATH, DEFAULT_BASE_PATHS, DEFAULT_ASSETS } from './constants'
import { loadStoredAccount, saveStoredAccount, clearStoredAccount } from './storage'
import { getTrezorSdk } from './sdk'

export function trezorModule(): WalletInit {
  return () => {
    return {
      label: 'Trezor',
      getIcon: async (): Promise<string> => `
<svg height="100%" viewBox="0 0 114 166" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <path d="M17,51.453125 L17,40 C17,17.90861 34.90861,0 57,0 C79.09139,0 97,17.90861 97,40 L97,51.453125 L113.736328,51.453125 L113.736328,139.193359 L57.5,166 L0,139.193359 L0,51.453125 L17,51.453125 Z M37,51.453125 L77,51.453125 L77,40 L76.9678398,40 C76.3750564,29.406335 67.6617997,21 57,21 C46.3382003,21 37.6249436,29.406335 37.0321602,40 L37,40 L37,51.453125 Z M23,72 L23,125 L56.8681641,140.966797 L91,125 L91,72 L23,72 Z" fill="var(--w3o-text-color, currentColor)"></path>
  </g>
</svg>`,
      getInterface: async ({ chains, EventEmitter }): Promise<WalletInterface> => {
        const DEFAULT_CHAIN = chains[0]

        const { BigNumber } = await import('@ethersproject/bignumber')
        const { createEIP1193Provider, ProviderRpcError, ProviderRpcErrorCode } = await import('@web3-onboard/common')
        const { accountSelect, getHardwareWalletProvider } = await import('@web3-onboard/hw-common')
        const { TypedDataEncoder, Signature, Transaction, JsonRpcProvider } = await import('ethers')

        const eventEmitter = new EventEmitter()
        const trezorSdk = await getTrezorSdk()

        /* -------------------------------------------------------------------------- */
        /*                                    State                                   */
        /* -------------------------------------------------------------------------- */

        // Restore previously selected account so eth_accounts returns it immediately on page reload,
        // avoiding a full re-authorization flow with the Trezor device.
        const stored = loadStoredAccount()
        const restoredChain = stored ? (chains.find((c) => c.id === stored.chainId) ?? DEFAULT_CHAIN) : DEFAULT_CHAIN
        let currentChain = restoredChain
        let currentAccount: Account | null = stored
          ? {
              address: stored.address as `0x${string}`,
              derivationPath: stored.derivationPath,
              balance: { asset: 'ETH', value: BigNumber.from(0) },
            }
          : null

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

        function setCurrentAccount(account: Account): void {
          currentAccount = account
          saveStoredAccount(account, currentChain.id)
          eventEmitter.emit('accountsChanged', [currentAccount.address])
        }

        function clearCurrentAccount(): void {
          currentAccount = null
          clearStoredAccount()
          eventEmitter.emit('accountsChanged', [])
        }

        function clearCurrentChain(): void {
          currentChain = DEFAULT_CHAIN
          eventEmitter.emit('chainChanged', currentChain.id)
        }

        function getAssertedDerivationPath(): string {
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
              if (!currentAccount) return []
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

              const { keccak256 } = await import('ethers')
              const txHash = keccak256(transaction.unsignedSerialized)

              const { showTrezorHashComparison, hideTrezorHashComparison } = await import('@/features/trezor')
              showTrezorHashComparison(txHash)

              try {
                const trezorTx = buildTrezorTransaction(transaction, parseInt(currentChain.id, 16))
                const { serializedTx } = await trezorSdk.signTransaction(getAssertedDerivationPath(), trezorTx)
                hideTrezorHashComparison()
                return (serializedTx.startsWith('0x') ? serializedTx : `0x${serializedTx}`) as `0x${string}`
              } catch (error) {
                hideTrezorHashComparison()
                throw error
              }
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
              // messages as is to avoid unreadable byte notation.
              const message = args.params[1]
              const signature = await trezorSdk.signMessage(getAssertedDerivationPath(), message)
              return Signature.from(`${signature}`).serialized
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
              const typedData = JSON.parse(args.params[1]) as EthereumSignTypedDataMessage<EthereumSignTypedDataTypes>

              // Pre-compute hashes so older Trezor firmware can verify the signing request
              // and show the domain name/version on devices that don't parse full EIP-712 data.
              const { EIP712Domain: _domain, ...typesWithoutDomain } = typedData.types
              const { salt, ...domainRest } = typedData.domain
              const normalizedDomain = {
                ...domainRest,
                // Trezor SDK types salt as ArrayBuffer but ethers expects BytesLike (string | Uint8Array)
                ...(salt !== undefined && { salt: salt instanceof ArrayBuffer ? new Uint8Array(salt) : salt }),
              }
              const domainSeparatorHash = TypedDataEncoder.hashDomain(normalizedDomain)
              const messageHash =
                typedData.primaryType !== 'EIP712Domain'
                  ? TypedDataEncoder.hashStruct(String(typedData.primaryType), typesWithoutDomain, typedData.message)
                  : undefined

              const signature = await trezorSdk.signTypedData(
                getAssertedDerivationPath(),
                typedData,
                domainSeparatorHash,
                messageHash,
              )
              return Signature.from(`${signature}`).serialized
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

        // Disconnects Trezor device and clears current account and chain
        eip1193Provider.disconnect = async () => {
          await trezorSdk.disconnect()
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
         * Gets a list of derived accounts from Trezor device for selection
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
         * Gets a list of derived accounts from Trezor device for selection.
         * For custom derivation paths, returns exactly one account.
         * For standard paths, fetches accounts in batches of BATCH_SIZE until
         * MAX_ZERO_BALANCE_ACCOUNTS consecutive zero-balance accounts are found.
         */
        async function deriveAccounts(args: ScanAccountsOptions): Promise<Array<Account>> {
          const BATCH_SIZE = 10
          const MAX_ZERO_BALANCE_ACCOUNTS = 5

          setCurrentChain(args.chainId)
          const provider = new JsonRpcProvider(currentChain.rpcUrl)

          if (args.derivationPath !== TREZOR_LIVE_PATH && args.derivationPath !== TREZOR_LEGACY_PATH) {
            const [account] = await fetchAccountBatch({
              derivationPath: [args.derivationPath],
              provider,
              asset: args.asset,
            })
            return [account]
          }

          const accounts: Account[] = []
          let zeroBalanceAccounts = 0
          let index = 0

          while (zeroBalanceAccounts < MAX_ZERO_BALANCE_ACCOUNTS) {
            const paths = Array.from({ length: BATCH_SIZE }, (_, i) => {
              const idx = index + i
              return args.derivationPath === TREZOR_LIVE_PATH
                ? `${args.derivationPath}/${idx}'/0/0`
                : `${args.derivationPath}/${idx}`
            })

            const batch = await fetchAccountBatch({ derivationPath: paths, provider, asset: args.asset })

            for (const account of batch) {
              accounts.push(account)
              if (account.balance.value.isZero()) {
                zeroBalanceAccounts++
              } else {
                zeroBalanceAccounts = 0
              }
              if (zeroBalanceAccounts >= MAX_ZERO_BALANCE_ACCOUNTS) break
            }

            index += BATCH_SIZE
          }

          return accounts
        }

        /** Fetches addresses and balances for a batch of derivation paths in parallel. */
        async function fetchAccountBatch(args: {
          derivationPath: string[]
          provider: InstanceType<typeof JsonRpcProvider>
          asset: Asset
        }): Promise<Account[]> {
          const resolved = await trezorSdk.getAddresses(args.derivationPath)
          const balances = await Promise.all(resolved.map(({ address }) => args.provider.getBalance(address)))

          return resolved.map(({ address, path }, i) => ({
            derivationPath: path,
            address,
            balance: { asset: args.asset.label, value: BigNumber.from(balances[i]) },
          }))
        }

        return { provider: eip1193Provider }
      },
    }
  }
}

function buildTrezorTransaction(tx: Transaction, chainId: number): TrezorTransaction {
  const value = `0x${(tx.value ?? 0n).toString(16)}`
  const gasLimit = `0x${(tx.gasLimit ?? 0n).toString(16)}`
  const nonce = `0x${tx.nonce.toString(16)}`
  const data = tx.data ?? '0x'
  const to = tx.to ?? null

  if (tx.maxFeePerGas != null) {
    return {
      to,
      value,
      gasLimit,
      maxFeePerGas: `0x${tx.maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${(tx.maxPriorityFeePerGas ?? 0n).toString(16)}`,
      nonce,
      data,
      chainId,
    }
  }

  return {
    to,
    value,
    gasPrice: `0x${(tx.gasPrice ?? 0n).toString(16)}`,
    gasLimit,
    nonce,
    data,
    chainId,
  }
}
