import { Methods } from '@safe-global/safe-apps-sdk'
import * as web3 from '@/hooks/wallets/web3'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { render, screen } from '@/tests/test-utils'
import * as execThroughRoleHooks from '@/components/tx/SignOrExecuteForm/ExecuteThroughRoleForm/hooks'
import type { TransactionInfo, TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import { SafeAppAccessPolicyTypes } from '@safe-global/safe-gateway-typescript-sdk'
import ReviewSignMessageOnChain from '@/components/tx-flow/flows/SignMessageOnChain/ReviewSignMessageOnChain'
import { JsonRpcProvider } from 'ethers'
import { act } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { SafeTxContextParams } from '../../SafeTxProvider'
import { SafeTxContext } from '../../SafeTxProvider'
import { createSafeTx } from '@/tests/builders/safeTx'
import * as useTxPreviewHooks from '@/components/tx/confirmation-views/useTxPreview'

jest.spyOn(execThroughRoleHooks, 'useRoles').mockReturnValue([])
describe('ReviewSignMessageOnChain', () => {
  test('can handle messages with EIP712Domain type in the JSON-RPC payload', async () => {
    const safeTx = createSafeTx()
    jest.spyOn(useTxPreviewHooks, 'default').mockReturnValue([
      {
        txInfo: {} as unknown as TransactionInfo,
        txData: {
          operation: safeTx.data.operation as number,
          to: { value: safeTx.data.to },
          hexData: safeTx.data.data,
          value: safeTx.data.value,
          trustedDelegateCallTarget: true,
        },
      } as TransactionPreview,
      undefined,
      false,
    ])
    jest.spyOn(web3, 'getWeb3ReadOnly').mockImplementation(() => new JsonRpcProvider())
    const safeAddress = faker.finance.ethereumAddress()
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .build(),
      safeLoaded: true,
      safeLoading: false,
    })

    await act(async () => {
      render(
        <SafeTxContext.Provider
          value={
            {
              safeTx,
            } as SafeTxContextParams
          }
        >
          <ReviewSignMessageOnChain
            app={{
              id: 73,
              url: 'https://app.com',
              name: 'App',
              iconUrl: 'https://app.com/icon.png',
              description: 'App description',
              chainIds: ['1'],
              tags: [],
              features: [],
              socialProfiles: [],
              developerWebsite: '',
              accessControl: {
                type: SafeAppAccessPolicyTypes.NoRestrictions,
              },
            }}
            requestId="73"
            message={{
              types: {
                Vote: [
                  {
                    name: 'from',
                    type: 'address',
                  },
                  {
                    name: 'space',
                    type: 'string',
                  },
                  {
                    name: 'timestamp',
                    type: 'uint64',
                  },
                  {
                    name: 'proposal',
                    type: 'bytes32',
                  },
                  {
                    name: 'choice',
                    type: 'uint32',
                  },
                ],
                EIP712Domain: [
                  { name: 'name', type: 'string' },
                  { name: 'version', type: 'string' },
                ],
              },
              domain: {
                name: 'snapshot',
                version: '0.1.4',
              },
              message: {
                from: '0x292bacf82268e143f5195af6928693699e31f911',
                space: 'fabien.eth',
                timestamp: '1663592967',
                proposal: '0xbe992f0a433d2dbe2e0cee579e5e1bdb625cdcb3a14357ea990c6cdc3e129991',
                choice: '1',
              },
            }}
            method={Methods.signTypedMessage}
          />
        </SafeTxContext.Provider>,
      )
    })

    expect(screen.getByText('Interact with SignMessageLib')).toBeInTheDocument()
  })
})
